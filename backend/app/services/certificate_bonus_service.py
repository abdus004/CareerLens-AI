"""
A small, deterministic bonus applied ON TOP OF the AI-computed Skill
Analysis / Career Intelligence scores at READ time - see
routes/skills.py:get_skill_analysis and
routes/career.py:get_career_analysis, the only two callers.

Deliberately NOT baked into the Gemini prompts themselves
(skill_analysis_prompt / career_recommendation_prompt) and NOT written
back into the stored analysis row: the underlying AI-computed score
always stays exactly what Gemini produced. That means:

  - Re-running Reanalyze can never compound a bonus on top of a
    previous bonus - it always starts from a clean AI baseline.
  - The bonus always reflects the student's CURRENT certificate count,
    not whatever it was the last time Reanalyze happened.
  - Nothing about the Skill Analysis / Career Intelligence Gemini call
    sites changes at all - this is purely additive at display time.

Each certificate in user_certificates marked career_relevant = true
counts - that flag is set once, at the moment the certificate is
added: either by certificate_ai_service.assess_certificate_relevance
(uploaded to My Certificates) or automatically (completed from a
Recommended Certification - see routes/certificates.py:complete_recommendation,
which is relevant by construction since it came from this student's
own personalized recommendations).
"""

from app.database.db import supabase

POINTS_PER_CERTIFICATE = 3
MAX_BONUS = 15


def get_certificate_bonus(email: str) -> dict:
    response = (
        supabase.table("user_certificates")
        .select("id", count="exact")
        .eq("email", email)
        .eq("career_relevant", True)
        .execute()
    )
    relevant_count = (
        response.count if response and response.count is not None
        else len(response.data or [])
    )
    bonus = min(relevant_count * POINTS_PER_CERTIFICATE, MAX_BONUS)
    return {"relevant_certificate_count": relevant_count, "bonus": bonus}


def apply_bonus(score, bonus: int) -> int:
    try:
        base = int(score or 0)
    except (TypeError, ValueError):
        base = 0
    return max(0, min(100, base + bonus))
