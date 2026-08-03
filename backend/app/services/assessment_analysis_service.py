from app.ai.gemini import generate_json
from app.ai.prompts import skill_assessment_feedback_prompt

_REQUIRED_FIELDS = ["strengths", "weak_areas", "recommendations"]


def generate_assessment_feedback(
    category: str,
    difficulty: str,
    percentage: float,
    correct_count: int,
    incorrect_count: int,
    skipped_count: int,
    topic_performance: list,
    incorrect_topics: list,
    time_taken_seconds: int,
    duration_seconds: int,
) -> dict:
    """
    The ONE Gemini call this feature makes (per spec: 0 calls during
    question answering, 1 call after submission). Called exactly once,
    from routes/skill_assessment.py's finish endpoint, strictly AFTER
    deterministic scoring has already produced every number below -
    Gemini never sees raw questions/answers and never influences the
    score, it only writes strengths/weak_areas/recommendations grounded
    in numbers it is given.

    Raises on any failure (invalid keys, bad JSON, missing fields) -
    the caller is responsible for catching this and letting the
    assessment result stand without AI feedback, since a score must
    never depend on Gemini being available.
    """

    prompt = skill_assessment_feedback_prompt(
        category=category,
        difficulty=difficulty,
        percentage=percentage,
        correct_count=correct_count,
        incorrect_count=incorrect_count,
        skipped_count=skipped_count,
        topic_performance=topic_performance,
        incorrect_topics=incorrect_topics,
        time_taken_seconds=time_taken_seconds,
        duration_seconds=duration_seconds,
    )

    result = generate_json(prompt)

    missing = [field for field in _REQUIRED_FIELDS if field not in result]
    if missing:
        raise ValueError(f"Gemini assessment feedback response is missing required field(s): {missing}")

    return {
        "strengths": result.get("strengths") or [],
        "weak_areas": result.get("weak_areas") or [],
        "recommendations": result.get("recommendations") or [],
    }
