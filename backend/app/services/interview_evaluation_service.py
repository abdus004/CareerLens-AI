from app.ai.gemini import generate_json
from app.ai.prompts import interview_evaluation_prompt

_REQUIRED_SCORE_FIELDS = [
    "overall_score",
    "technical_knowledge_score",
    "communication_score",
    "english_score",
    "confidence_score",
    "vocabulary_score",
]


def evaluate_interview(interview_type: str, target_role: str, difficulty: str, answers: list) -> dict:
    """
    Gemini Call 2 of 2 for the Mock Interview feature - called exactly
    once, from routes/mock_interview.py's finish endpoint, after every
    answer has already been saved. Never called per-question.

    `answers` is the ordered list of
    {question_number, question_text, answer_text, skipped, time_taken_seconds}
    dicts pulled from interview_answers.
    """

    prompt = interview_evaluation_prompt(
        interview_type=interview_type,
        target_role=target_role,
        difficulty=difficulty,
        answers=answers,
    )

    result = generate_json(prompt)

    missing = [field for field in _REQUIRED_SCORE_FIELDS if field not in result]
    if missing:
        raise ValueError(f"Gemini evaluation response is missing required field(s): {missing}")

    return result