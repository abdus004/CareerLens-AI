import random

from app.database.db import supabase

# ---------------------------------------------------------------------
# Question selection for the Skill Assessment feature.
#
# Unlike the Mock Interview feature's question_bank_service.py, this
# NEVER calls Gemini. Per spec, assessment questions must come only
# from the deterministic Supabase question bank, chosen with a plain
# random sample - there is no "well-spread selection" step here
# because these are short, independent MCQs (not open-ended interview
# questions), so a random sample of the requested count is already a
# fair, representative test.
# ---------------------------------------------------------------------


def fetch_bank_rows(category: str, difficulty: str) -> list:
    """
    Full rows (including correct_answer/explanation) for one
    (category, difficulty) bucket. Used both for picking a fresh
    attempt's questions and for scoring an already-selected set of
    question_ids.
    """
    response = (
        supabase.table("assessment_question_bank")
        .select("id, category, topic, difficulty, question, option_a, option_b, option_c, option_d, correct_answer, explanation")
        .eq("category", category)
        .eq("difficulty", difficulty)
        .execute()
    )
    return response.data or []


def fetch_bank_rows_by_ids(question_ids: list) -> dict:
    """Returns {id: row} for exactly the given question ids, for scoring/review."""
    if not question_ids:
        return {}

    response = (
        supabase.table("assessment_question_bank")
        .select("id, category, topic, difficulty, question, option_a, option_b, option_c, option_d, correct_answer, explanation")
        .in_("id", question_ids)
        .execute()
    )
    return {row["id"]: row for row in (response.data or [])}


def select_assessment_questions(category: str, difficulty: str, num_questions: int) -> list:
    """
    Picks `num_questions` random, non-duplicate questions from the
    (category, difficulty) bucket. Returns full rows (the route layer
    is responsible for stripping correct_answer/explanation before
    anything is sent to the frontend - see routes/skill_assessment.py).

    Raises ValueError if the bank doesn't have enough questions for
    this combination, mirroring select_interview_questions's behavior.
    """
    candidates = fetch_bank_rows(category, difficulty)

    if len(candidates) < num_questions:
        raise ValueError(
            f"Not enough questions in the bank for {category} / {difficulty} "
            f"(found {len(candidates)}, need {num_questions})."
        )

    return random.sample(candidates, num_questions)
