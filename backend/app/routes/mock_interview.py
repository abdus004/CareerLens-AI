from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.database.db import supabase
from app.models.mock_interview import (
    RetakeInterviewRequest,
    SaveAnswerRequest,
    StartInterviewRequest,
)
from app.services.interview_evaluation_service import evaluate_interview
from app.services.question_bank_service import select_interview_questions
from app.utils.security import get_authenticated_email, require_self

router = APIRouter(
    prefix="/mock-interview",
    tags=["Mock Interview"],
)

VALID_INTERVIEW_TYPES = {"Technical", "HR", "Behavioral", "Mixed"}
VALID_DIFFICULTIES = {"Easy", "Medium", "Hard"}
VALID_NUM_QUESTIONS = {5, 10, 15, 20}


def _require_owns_interview(interview_id: str, auth_email: str) -> dict:
    """
    Endpoints keyed only by interview_id (no email in the path/body)
    still need an ownership check - otherwise anyone who guesses/finds
    an interview_id could read or act on someone else's interview.
    Fetches just enough to verify ownership and returns the row so
    callers that need the full interview don't have to fetch it twice.
    """
    response = (
        supabase.table("interviews")
        .select("*")
        .eq("id", interview_id)
        .maybe_single()
        .execute()
    )

    if not response or not response.data:
        raise HTTPException(status_code=404, detail="Interview not found.")

    require_self(response.data["email"], auth_email)
    return response.data


def _validate_settings(interview_type: str, difficulty: str, num_questions: int):
    if interview_type not in VALID_INTERVIEW_TYPES:
        raise HTTPException(status_code=400, detail=f"interview_type must be one of {sorted(VALID_INTERVIEW_TYPES)}.")
    if difficulty not in VALID_DIFFICULTIES:
        raise HTTPException(status_code=400, detail=f"difficulty must be one of {sorted(VALID_DIFFICULTIES)}.")
    if num_questions not in VALID_NUM_QUESTIONS:
        raise HTTPException(status_code=400, detail=f"num_questions must be one of {sorted(VALID_NUM_QUESTIONS)}.")


def _create_interview(email: str, interview_type: str, target_role: str, difficulty: str, num_questions: int) -> dict:
    try:
        questions = select_interview_questions(interview_type, target_role, difficulty, num_questions)
    except ValueError as e:
        # Not enough questions in the bank for this exact combination -
        # a genuine 400, not a server error.
        raise HTTPException(status_code=400, detail=str(e))

    row = {
        "email": email,
        "interview_type": interview_type,
        "target_role": target_role,
        "difficulty": difficulty,
        "num_questions": num_questions,
        "question_ids": [q["id"] for q in questions],
        "status": "in_progress",
    }

    response = supabase.table("interviews").insert(row).execute()
    interview = response.data[0]

    return {
        "interview_id": interview["id"],
        "interview_type": interview_type,
        "target_role": target_role,
        "difficulty": difficulty,
        "num_questions": num_questions,
        "questions": [
            {"question_number": i + 1, "question_id": q["id"], "question_text": q["question_text"]}
            for i, q in enumerate(questions)
        ],
    }


@router.post("/start")
def start_interview(
    payload: StartInterviewRequest,
    auth_email: str = Depends(get_authenticated_email),
):
    require_self(payload.email, auth_email)
    _validate_settings(payload.interview_type, payload.difficulty, payload.num_questions)

    try:
        return {
            "success": True,
            "data": _create_interview(
                payload.email,
                payload.interview_type,
                payload.target_role,
                payload.difficulty,
                payload.num_questions,
            ),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{interview_id}")
def get_interview(
    interview_id: str,
    auth_email: str = Depends(get_authenticated_email),
):
    """
    Returns interview metadata plus its full ordered question list.
    Exists so the Mode Select, Chat Interview, and Voice Interview
    pages can recover on a page refresh instead of depending entirely
    on React Router navigation state, which is lost on reload.
    """
    try:
        interview = _require_owns_interview(interview_id, auth_email)
        question_ids = interview.get("question_ids") or []

        questions_response = (
            supabase.table("question_bank")
            .select("id, question_text")
            .in_("id", question_ids)
            .execute()
        )
        text_by_id = {q["id"]: q["question_text"] for q in (questions_response.data or [])}

        answers_response = (
            supabase.table("interview_answers")
            .select("question_number, answer_text, skipped")
            .eq("interview_id", interview_id)
            .execute()
        )
        answered_numbers = {a["question_number"]: a for a in (answers_response.data or [])}

        questions = []
        for i, qid in enumerate(question_ids):
            question_number = i + 1
            existing_answer = answered_numbers.get(question_number)
            questions.append(
                {
                    "question_number": question_number,
                    "question_id": qid,
                    # Falls back to the live question_bank text if the
                    # question was answered before a bank edit, and to
                    # a placeholder only in the unlikely case the bank
                    # row was deleted entirely after being answered.
                    "question_text": text_by_id.get(qid, "Question no longer available."),
                    "answer_text": existing_answer["answer_text"] if existing_answer else "",
                    "skipped": existing_answer["skipped"] if existing_answer else False,
                }
            )

        return {
            "success": True,
            "data": {
                "interview_id": interview["id"],
                "interview_type": interview["interview_type"],
                "target_role": interview["target_role"],
                "difficulty": interview["difficulty"],
                "num_questions": interview["num_questions"],
                "status": interview["status"],
                "questions": questions,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{interview_id}/answer")
def save_answer(
    interview_id: str,
    payload: SaveAnswerRequest,
    auth_email: str = Depends(get_authenticated_email),
):
    try:
        _require_owns_interview(interview_id, auth_email)

        row = {
            "interview_id": interview_id,
            "question_number": payload.question_number,
            "question_id": payload.question_id,
            "question_text": payload.question_text,
            "answer_text": payload.answer_text,
            "time_taken_seconds": payload.time_taken_seconds,
            "skipped": payload.skipped,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        supabase.table("interview_answers").upsert(
            row,
            on_conflict="interview_id,question_number",
        ).execute()

        return {"success": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{interview_id}/finish")
def finish_interview(
    interview_id: str,
    auth_email: str = Depends(get_authenticated_email),
):
    try:
        interview = _require_owns_interview(interview_id, auth_email)

        answers_response = (
            supabase.table("interview_answers")
            .select("question_number, question_text, answer_text, skipped, time_taken_seconds")
            .eq("interview_id", interview_id)
            .order("question_number")
            .execute()
        )
        answers = answers_response.data or []

        if not answers:
            raise HTTPException(status_code=400, detail="Cannot finish an interview with no saved answers.")

        evaluation = evaluate_interview(
            interview_type=interview["interview_type"],
            target_role=interview["target_role"],
            difficulty=interview["difficulty"],
            answers=answers,
        )

        result_row = {
            "interview_id": interview_id,
            "overall_score": evaluation["overall_score"],
            "technical_score": evaluation["technical_knowledge_score"],
            "communication_score": evaluation["communication_score"],
            "english_score": evaluation["english_score"],
            "confidence_score": evaluation["confidence_score"],
            "vocabulary_score": evaluation["vocabulary_score"],
            "per_question_feedback": evaluation.get("per_question_feedback", []),
            "strengths": evaluation.get("strengths", []),
            "areas_to_improve": evaluation.get("areas_to_improve", []),
            "final_recommendation": evaluation.get("final_recommendation", ""),
        }

        supabase.table("interview_results").upsert(
            result_row,
            on_conflict="interview_id",
        ).execute()

        supabase.table("interviews").update(
            {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", interview_id).execute()

        return {"success": True, "data": result_row}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{interview_id}/result")
def get_result(
    interview_id: str,
    auth_email: str = Depends(get_authenticated_email),
):
    try:
        _require_owns_interview(interview_id, auth_email)

        response = (
            supabase.table("interview_results")
            .select("*")
            .eq("interview_id", interview_id)
            .maybe_single()
            .execute()
        )

        if not response or not response.data:
            raise HTTPException(status_code=404, detail="This interview has not been evaluated yet.")

        return {"success": True, "data": response.data}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{interview_id}/retake")
def retake_interview(
    interview_id: str,
    payload: RetakeInterviewRequest,
    auth_email: str = Depends(get_authenticated_email),
):
    """
    Generates a fresh interview with the same settings (interview_type,
    target_role, difficulty, num_questions) as an existing one, with a
    newly and independently selected set of questions - a new
    interviews row, not a reset of the old one, so the original
    attempt's answers and result stay intact.
    """
    require_self(payload.email, auth_email)

    try:
        original = _require_owns_interview(interview_id, auth_email)

        return {
            "success": True,
            "data": _create_interview(
                payload.email,
                original["interview_type"],
                original["target_role"],
                original["difficulty"],
                original["num_questions"],
            ),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))