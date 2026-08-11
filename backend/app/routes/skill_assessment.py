from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.database.db import supabase
from app.models.skill_assessment import (
    GenerateCertificateRequest,
    RetakeAssessmentRequest,
    SaveAssessmentAnswerRequest,
    StartAssessmentRequest,
)
from app.services.assessment_analysis_service import generate_assessment_feedback
from app.services.assessment_question_bank_service import (
    fetch_bank_rows_by_ids,
    select_assessment_questions,
)
from app.services.assessment_scoring_service import score_assessment
from app.services.certificate_service import generate_certificate
from app.utils.security import get_authenticated_email, require_self

router = APIRouter(
    prefix="/skill-assessment",
    tags=["Skill Assessment"],
)

VALID_CATEGORIES = {"Programming", "Aptitude", "Reasoning", "SQL", "Python", "Java", "AI/ML"}
VALID_DIFFICULTIES = {"Easy", "Medium", "Hard"}
VALID_NUM_QUESTIONS = {10, 15, 20}
VALID_OPTIONS = {"A", "B", "C", "D"}

# Seconds allotted per question, by difficulty - the single source of
# truth for the duration calculation, used identically whether the
# student is starting a fresh attempt or retaking one.
SECONDS_PER_QUESTION = {"Easy": 60, "Medium": 75, "Hard": 90}


def _require_owns_assessment(assessment_id: str, auth_email: str) -> dict:
    """
    Same ownership-lookup pattern as mock_interview.py's
    _require_owns_interview - endpoints keyed only by assessment_id
    (no email in the path/body) still need to verify the logged-in
    user actually owns that assessment before reading or acting on it.
    """
    response = (
        supabase.table("assessments")
        .select("*")
        .eq("id", assessment_id)
        .maybe_single()
        .execute()
    )

    if not response or not response.data:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    require_self(response.data["email"], auth_email)
    return response.data


def _validate_settings(category: str, difficulty: str, num_questions: int):
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"category must be one of {sorted(VALID_CATEGORIES)}.")
    if difficulty not in VALID_DIFFICULTIES:
        raise HTTPException(status_code=400, detail=f"difficulty must be one of {sorted(VALID_DIFFICULTIES)}.")
    if num_questions not in VALID_NUM_QUESTIONS:
        raise HTTPException(status_code=400, detail=f"num_questions must be one of {sorted(VALID_NUM_QUESTIONS)}.")


def _create_assessment(email: str, category: str, difficulty: str, num_questions: int) -> dict:
    try:
        questions = select_assessment_questions(category, difficulty, num_questions)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    duration_seconds = num_questions * SECONDS_PER_QUESTION[difficulty]
    started_at = datetime.now(timezone.utc)
    expires_at = started_at + timedelta(seconds=duration_seconds)

    row = {
        "email": email,
        "category": category,
        "difficulty": difficulty,
        "num_questions": num_questions,
        "question_ids": [q["id"] for q in questions],
        "duration_seconds": duration_seconds,
        "started_at": started_at.isoformat(),
        "expires_at": expires_at.isoformat(),
        "status": "in_progress",
    }

    response = supabase.table("assessments").insert(row).execute()
    assessment = response.data[0]

    # SECURITY: only id / question / options / question_number ever
    # reach the frontend here - never correct_answer or explanation.
    return {
        "assessment_id": assessment["id"],
        "category": category,
        "difficulty": difficulty,
        "num_questions": num_questions,
        "duration_seconds": duration_seconds,
        "started_at": assessment["started_at"],
        "expires_at": assessment["expires_at"],
        "questions": [
            {
                "question_number": i + 1,
                "question_id": q["id"],
                "question": q["question"],
                "option_a": q["option_a"],
                "option_b": q["option_b"],
                "option_c": q["option_c"],
                "option_d": q["option_d"],
            }
            for i, q in enumerate(questions)
        ],
    }


@router.post("/start")
def start_assessment(
    payload: StartAssessmentRequest,
    auth_email: str = Depends(get_authenticated_email),
):
    require_self(payload.email, auth_email)
    _validate_settings(payload.category, payload.difficulty, payload.num_questions)

    try:
        return {
            "success": True,
            "data": _create_assessment(payload.email, payload.category, payload.difficulty, payload.num_questions),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
def get_history(email: str, auth_email: str = Depends(get_authenticated_email)):
    """Completed attempts for the Skill Assessment main page's 'Previous Assessments' list."""
    require_self(email, auth_email)

    try:
        assessments_response = (
            supabase.table("assessments")
            .select("id, category, difficulty, num_questions, completed_at")
            .eq("email", email)
            .eq("status", "completed")
            .order("completed_at", desc=True)
            .execute()
        )
        assessments = assessments_response.data or []
        if not assessments:
            return {"success": True, "data": []}

        assessment_ids = [a["id"] for a in assessments]
        results_response = (
            supabase.table("assessment_results")
            .select("assessment_id, percentage, passed")
            .in_("assessment_id", assessment_ids)
            .execute()
        )
        results_by_id = {r["assessment_id"]: r for r in (results_response.data or [])}

        certificates_response = (
            supabase.table("certificates")
            .select("assessment_id, certificate_id, pdf_url")
            .in_("assessment_id", assessment_ids)
            .execute()
        )
        certificates_by_id = {c["assessment_id"]: c for c in (certificates_response.data or [])}

        data = []
        for a in assessments:
            result = results_by_id.get(a["id"])
            if not result:
                continue
            certificate = certificates_by_id.get(a["id"])
            data.append(
                {
                    "assessment_id": a["id"],
                    "category": a["category"],
                    "difficulty": a["difficulty"],
                    "num_questions": a["num_questions"],
                    "completed_at": a["completed_at"],
                    "percentage": result["percentage"],
                    "passed": result["passed"],
                    "certificate": certificate,
                }
            )

        return {"success": True, "data": data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{assessment_id}")
def get_assessment(
    assessment_id: str,
    auth_email: str = Depends(get_authenticated_email),
):
    """
    Assessment metadata + its full ordered, answer-safe question list -
    lets the Assessment Test page recover on a page refresh, and lets
    the frontend know started_at/expires_at so its countdown timer is
    seeded from the backend's clock rather than its own.
    """
    try:
        assessment = _require_owns_assessment(assessment_id, auth_email)
        question_ids = assessment.get("question_ids") or []

        bank_by_id = fetch_bank_rows_by_ids(question_ids)

        answers_response = (
            supabase.table("assessment_answers")
            .select("question_number, selected_option, skipped")
            .eq("assessment_id", assessment_id)
            .execute()
        )
        answered_numbers = {a["question_number"]: a for a in (answers_response.data or [])}

        questions = []
        for i, qid in enumerate(question_ids):
            question_number = i + 1
            existing_answer = answered_numbers.get(question_number)
            bank_row = bank_by_id.get(qid)

            questions.append(
                {
                    "question_number": question_number,
                    "question_id": qid,
                    "question": bank_row["question"] if bank_row else "Question no longer available.",
                    "option_a": bank_row["option_a"] if bank_row else "",
                    "option_b": bank_row["option_b"] if bank_row else "",
                    "option_c": bank_row["option_c"] if bank_row else "",
                    "option_d": bank_row["option_d"] if bank_row else "",
                    "selected_option": existing_answer["selected_option"] if existing_answer else None,
                    "skipped": existing_answer["skipped"] if existing_answer else False,
                }
            )

        return {
            "success": True,
            "data": {
                "assessment_id": assessment["id"],
                "category": assessment["category"],
                "difficulty": assessment["difficulty"],
                "num_questions": assessment["num_questions"],
                "duration_seconds": assessment["duration_seconds"],
                "started_at": assessment["started_at"],
                "expires_at": assessment["expires_at"],
                "status": assessment["status"],
                "questions": questions,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{assessment_id}/answer")
def save_answer(
    assessment_id: str,
    payload: SaveAssessmentAnswerRequest,
    auth_email: str = Depends(get_authenticated_email),
):
    try:
        assessment = _require_owns_assessment(assessment_id, auth_email)
        if assessment["status"] == "completed":
            raise HTTPException(status_code=400, detail="This assessment has already been submitted.")

        selected_option = payload.selected_option.upper() if payload.selected_option else None
        if selected_option is not None and selected_option not in VALID_OPTIONS:
            raise HTTPException(status_code=400, detail="selected_option must be one of A, B, C, D.")

        row = {
            "assessment_id": assessment_id,
            "question_number": payload.question_number,
            "question_id": payload.question_id,
            "selected_option": None if payload.skipped else selected_option,
            "skipped": payload.skipped,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        supabase.table("assessment_answers").upsert(
            row,
            on_conflict="assessment_id,question_number",
        ).execute()

        return {"success": True}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{assessment_id}/finish")
def finish_assessment(
    assessment_id: str,
    auth_email: str = Depends(get_authenticated_email),
):
    try:
        assessment = _require_owns_assessment(assessment_id, auth_email)

        # Idempotent: re-clicking Finish (or a slow network retry)
        # returns the already-computed result instead of re-scoring or
        # spending a second Gemini call.
        if assessment["status"] == "completed":
            existing_result = (
                supabase.table("assessment_results")
                .select("*")
                .eq("assessment_id", assessment_id)
                .maybe_single()
                .execute()
            )
            if existing_result and existing_result.data:
                return {"success": True, "data": existing_result.data}

        question_ids = assessment.get("question_ids") or []
        bank_by_id = fetch_bank_rows_by_ids(question_ids)

        answers_response = (
            supabase.table("assessment_answers")
            .select("question_number, selected_option, skipped")
            .eq("assessment_id", assessment_id)
            .execute()
        )
        answers_by_number = {a["question_number"]: a for a in (answers_response.data or [])}

        # Backend-side expiration validation: time actually taken is
        # capped at the allotted duration, regardless of how late the
        # finish request itself arrives (e.g. a slow network after the
        # timer already hit zero). Work already saved is still scored -
        # nothing is discarded because the student ran out of time.
        started_at = datetime.fromisoformat(assessment["started_at"])
        now = datetime.now(timezone.utc)
        elapsed_seconds = max(0, int((now - started_at).total_seconds()))
        time_taken_seconds = min(elapsed_seconds, assessment["duration_seconds"])

        scoring = score_assessment(question_ids, bank_by_id, answers_by_number)

        result_row = {
            "assessment_id": assessment_id,
            "total_questions": scoring["total_questions"],
            "correct_count": scoring["correct_count"],
            "incorrect_count": scoring["incorrect_count"],
            "skipped_count": scoring["skipped_count"],
            "percentage": scoring["percentage"],
            "passed": scoring["passed"],
            "topic_performance": scoring["topic_performance"],
            "time_taken_seconds": time_taken_seconds,
            "strengths": None,
            "weak_areas": None,
            "recommendations": None,
            "ai_feedback_available": False,
        }

        # Gemini Call (1 of 1) for this feature. Wrapped defensively:
        # the deterministic score above is already final and correct
        # regardless of whether this succeeds.
        try:
            feedback = generate_assessment_feedback(
                category=assessment["category"],
                difficulty=assessment["difficulty"],
                percentage=scoring["percentage"],
                correct_count=scoring["correct_count"],
                incorrect_count=scoring["incorrect_count"],
                skipped_count=scoring["skipped_count"],
                topic_performance=scoring["topic_performance"],
                incorrect_topics=scoring["incorrect_topics"],
                time_taken_seconds=time_taken_seconds,
                duration_seconds=assessment["duration_seconds"],
            )
            result_row["strengths"] = feedback["strengths"]
            result_row["weak_areas"] = feedback["weak_areas"]
            result_row["recommendations"] = feedback["recommendations"]
            result_row["ai_feedback_available"] = True
        except Exception as ai_error:
            print(f"[Skill Assessment] AI feedback failed (result still saved): {ai_error}")

        supabase.table("assessment_results").upsert(
            result_row,
            on_conflict="assessment_id",
        ).execute()

        supabase.table("assessments").update(
            {"status": "completed", "completed_at": now.isoformat()}
        ).eq("id", assessment_id).execute()

        return {"success": True, "data": result_row}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{assessment_id}/result")
def get_result(
    assessment_id: str,
    auth_email: str = Depends(get_authenticated_email),
):
    try:
        _require_owns_assessment(assessment_id, auth_email)

        response = (
            supabase.table("assessment_results")
            .select("*")
            .eq("assessment_id", assessment_id)
            .maybe_single()
            .execute()
        )
        if not response or not response.data:
            raise HTTPException(status_code=404, detail="This assessment has not been submitted yet.")

        assessment_response = (
            supabase.table("assessments")
            .select("category, difficulty, num_questions")
            .eq("id", assessment_id)
            .maybe_single()
            .execute()
        )
        assessment_meta = (assessment_response.data if assessment_response else None) or {}

        certificate_response = (
            supabase.table("certificates")
            .select("*")
            .eq("assessment_id", assessment_id)
            .maybe_single()
            .execute()
        )
        certificate = certificate_response.data if certificate_response and certificate_response.data else None

        return {
            "success": True,
            "data": {**response.data, **assessment_meta, "certificate": certificate},
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{assessment_id}/review")
def get_review(
    assessment_id: str,
    auth_email: str = Depends(get_authenticated_email),
):
    """
    Only ever returns correct answers/explanations for a COMPLETED
    assessment - never while status is still 'in_progress'. This is
    the one and only place in the feature where correct_answer leaves
    the backend.
    """
    try:
        assessment_response = (
            supabase.table("assessments")
            .select("id, email, status, question_ids")
            .eq("id", assessment_id)
            .maybe_single()
            .execute()
        )
        if not assessment_response or not assessment_response.data:
            raise HTTPException(status_code=404, detail="Assessment not found.")

        assessment = assessment_response.data
        require_self(assessment["email"], auth_email)
        if assessment["status"] != "completed":
            raise HTTPException(status_code=403, detail="Answers can only be reviewed after the assessment is submitted.")

        question_ids = assessment.get("question_ids") or []
        bank_by_id = fetch_bank_rows_by_ids(question_ids)

        answers_response = (
            supabase.table("assessment_answers")
            .select("question_number, selected_option, skipped")
            .eq("assessment_id", assessment_id)
            .execute()
        )
        answers_by_number = {a["question_number"]: a for a in (answers_response.data or [])}

        review = []
        for i, qid in enumerate(question_ids, start=1):
            bank_row = bank_by_id.get(qid)
            answer_row = answers_by_number.get(i)
            selected_option = (answer_row or {}).get("selected_option")

            if bank_row is None:
                continue

            options = {
                "A": bank_row["option_a"],
                "B": bank_row["option_b"],
                "C": bank_row["option_c"],
                "D": bank_row["option_d"],
            }

            review.append(
                {
                    "question_number": i,
                    "topic": bank_row["topic"],
                    "question": bank_row["question"],
                    "options": options,
                    "your_answer": selected_option,
                    "your_answer_text": options.get(selected_option) if selected_option else None,
                    "correct_answer": bank_row["correct_answer"],
                    "correct_answer_text": options.get(bank_row["correct_answer"]),
                    "is_correct": selected_option == bank_row["correct_answer"],
                    "skipped": (answer_row or {}).get("skipped", not selected_option),
                    "explanation": bank_row["explanation"],
                }
            )

        return {"success": True, "data": review}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{assessment_id}/certificate")
def issue_certificate(
    assessment_id: str,
    payload: GenerateCertificateRequest,
    auth_email: str = Depends(get_authenticated_email),
):
    require_self(payload.email, auth_email)
    try:
        certificate = generate_certificate(assessment_id, payload.email)
        return {"success": True, "data": certificate}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{assessment_id}/retake")
def retake_assessment(
    assessment_id: str,
    payload: RetakeAssessmentRequest,
    auth_email: str = Depends(get_authenticated_email),
):
    """
    Generates a fresh attempt with the same settings (category,
    difficulty, num_questions), with a newly and independently
    selected set of questions - a new assessments row, not a reset of
    the old one, so the original attempt's answers/result/certificate
    stay intact.
    """
    require_self(payload.email, auth_email)

    try:
        original = _require_owns_assessment(assessment_id, auth_email)

        return {
            "success": True,
            "data": _create_assessment(
                payload.email,
                original["category"],
                original["difficulty"],
                original["num_questions"],
            ),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
