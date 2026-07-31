import logging
import random

from app.ai.gemini import generate_json
from app.ai.prompts import interview_question_selection_prompt
from app.database.db import supabase

logger = logging.getLogger(__name__)

# Roles with a dedicated, pre-curated Technical bucket in question_bank.
# "None" (General) and "Other" (custom role) are handled separately -
# see _fetch_candidates below.
SEEDED_ROLES = {
    "Software Engineer",
    "AI Engineer",
    "Machine Learning Engineer",
    "Backend Developer",
    "Frontend Developer",
    "Full Stack Developer",
    "Data Analyst",
    "Data Scientist",
    "Cloud Engineer",
    "Cybersecurity Engineer",
}


def _fetch_bucket(role, interview_type, difficulty):
    query = (
        supabase.table("question_bank")
        .select("id, question_text")
        .eq("interview_type", interview_type)
        .eq("difficulty", difficulty)
    )
    query = query.is_("role", "null") if role is None else query.eq("role", role)
    response = query.execute()
    return response.data or []


def _fetch_candidates(interview_type: str, target_role: str, difficulty: str) -> list:
    """
    Builds the deterministic candidate pool Gemini (or the random
    fallback) is allowed to choose from. This is the one place that
    decides, in plain readable code, which question_bank rows are even
    eligible - Gemini never sees questions outside this pool, so it can
    never select something irrelevant to what the student asked for.

    - Technical + a role we have a seeded bucket for -> that role's bucket.
    - Technical + "Other" (a custom role) or Technical + None (General)
      -> the General technical bucket, since there is no pre-written
      content for an arbitrary free-text role. See the docstring at the
      top of scripts/seed_question_bank.py for why that content
      cannot exist ahead of time.
    - HR / Behavioral -> their own general (not role-specific) bucket,
      regardless of target_role.
    - Mixed -> the Technical pool (role-appropriate) blended with the
      HR and Behavioral pools, so a Mixed interview genuinely spans
      all three instead of needing its own duplicate question set.
    """

    if interview_type == "Mixed":
        technical_role = target_role if target_role in SEEDED_ROLES else None
        pool = (
            _fetch_bucket(technical_role, "Technical", difficulty)
            + _fetch_bucket(None, "HR", difficulty)
            + _fetch_bucket(None, "Behavioral", difficulty)
        )
        return pool

    if interview_type == "Technical":
        role = target_role if target_role in SEEDED_ROLES else None
        return _fetch_bucket(role, "Technical", difficulty)

    # HR or Behavioral - never role-specific.
    return _fetch_bucket(None, interview_type, difficulty)


def _select_with_gemini(candidates: list, interview_type, target_role, difficulty, num_questions):
    prompt = interview_question_selection_prompt(
        candidate_questions=candidates,
        interview_type=interview_type,
        target_role=target_role,
        difficulty=difficulty,
        num_questions=num_questions,
    )

    result = generate_json(prompt)
    selected_ids = result.get("selected_question_ids", [])

    valid_ids = {c["id"] for c in candidates}
    selected_ids = [qid for qid in selected_ids if qid in valid_ids]

    # De-duplicate while preserving order, in case Gemini repeats an id.
    seen = set()
    deduped = []
    for qid in selected_ids:
        if qid not in seen:
            deduped.append(qid)
            seen.add(qid)

    if len(deduped) != num_questions:
        raise ValueError(
            f"Gemini returned {len(deduped)} valid, unique question ids; expected {num_questions}."
        )

    by_id = {c["id"]: c["question_text"] for c in candidates}
    return [{"id": qid, "question_text": by_id[qid]} for qid in deduped]


def select_interview_questions(interview_type: str, target_role: str, difficulty: str, num_questions: int) -> list:
    """
    Gemini Call 1 of 2 for the Mock Interview feature. Fetches the
    deterministic candidate pool, asks Gemini to choose a well-spread
    subset of it (see interview_question_selection_prompt for exactly
    what Gemini is and is not allowed to do), and falls back to a plain
    random sample from the same pool if that call fails for any reason
    - an interview must always be able to start.

    Returns an ordered list of {"id", "question_text"} dicts, already
    shuffled (by Gemini's selection, or by the fallback), ready to be
    stored as interviews.question_ids and shown to the student in that
    order.
    """

    candidates = _fetch_candidates(interview_type, target_role, difficulty)

    if len(candidates) < num_questions:
        raise ValueError(
            f"Not enough questions in the bank for {interview_type} / "
            f"{target_role or 'General'} / {difficulty} "
            f"(found {len(candidates)}, need {num_questions})."
        )

    try:
        return _select_with_gemini(candidates, interview_type, target_role, difficulty, num_questions)
    except Exception:
        logger.exception(
            "Gemini question selection failed - falling back to a random sample from the candidate pool."
        )
        chosen = random.sample(candidates, num_questions)
        return [{"id": c["id"], "question_text": c["question_text"]} for c in chosen]