import hashlib
import json

from app.database.db import supabase
from app.ai.gemini import generate_json
from app.ai.prompts import profile_resume_analysis_prompt


def _hash_resume_text(resume_text: str) -> str:
    return hashlib.sha256(resume_text.encode("utf-8")).hexdigest()


def _load_profile_context(email: str) -> dict | None:
    """
    Best-effort only: Resume Analysis can legitimately run before a
    profile row fully exists (Profile Setup calls it mid-wizard), so a
    missing/partial profile here must never block resume analysis
    itself - it just means `suggestions` falls back to resume-text-only
    personalization, exactly like before this existed.
    """
    try:
        response = (
            supabase
            .table("profiles")
            .select("career_goal, user_type, experience_years, year, cgpa, department, degree, skills")
            .eq("email", email)
            .maybe_single()
            .execute()
        )
    except Exception:
        return None

    if not response or not response.data:
        return None

    row = dict(response.data)
    for field in ("career_goal", "skills"):
        if row.get(field):
            try:
                row[field] = json.loads(row[field])
            except Exception:
                pass

    # Drop empty values instead of sending a wall of blank fields to
    # Gemini for a profile that's only partially filled in.
    return {k: v for k, v in row.items() if v not in (None, "", [], {})}


def run_profile_resume_analysis(email: str, resume_text: str) -> dict:
    """
    Runs (or reuses) the Resume Analysis that backs the Dashboard's
    Resume Score card and AI Suggestions card.

    This is the "Resume Analysis [that] happens during Profile Setup
    (or when a new resume is uploaded)" - it is NOT the standalone
    Resume Analyzer feature (that stays independent and stateless, per
    the existing separation between Profile Resume and Resume
    Analyzer). Results are persisted so the Dashboard can read them
    without ever calling Gemini itself.

    If the resume content hasn't changed since the last time this ran
    for this email (compared via a content hash), the existing stored
    result is returned as-is and Gemini is not called again.
    """

    new_hash = _hash_resume_text(resume_text)

    existing = (
        supabase
        .table("resume_analysis")
        .select("*")
        .eq("email", email)
        .maybe_single()
        .execute()
    )

    if existing and existing.data and existing.data.get("resume_hash") == new_hash:
        # Resume content is unchanged since the last analysis - reuse
        # the stored result instead of calling Gemini again.
        return existing.data

    profile_context = _load_profile_context(email)
    prompt = profile_resume_analysis_prompt(resume_text, profile_context)
    result = generate_json(prompt)

    resume_analysis_row = {
        "email": email,
        "resume_score": result.get("resume_score", 0),
        "ats_score": result.get("ats_score", 0),
        "keyword_score": result.get("keyword_score", 0),
        "formatting_score": result.get("formatting_score", 0),
        "grammar_score": result.get("grammar_score", 0),
        "missing_skills": result.get("missing_skills", []),
        "strengths": result.get("strengths", []),
        "weaknesses": result.get("weaknesses", []),
        "ai_summary": result.get("ai_summary", ""),
        "resume_hash": new_hash,
    }

    resume_data_row = {
        "email": email,
        "skills": result.get("skills", []),
        "projects": result.get("projects", []),
        "education": result.get("education", []),
        "experience": result.get("experience", []),
        "certifications": result.get("certifications", []),
        "languages": result.get("languages", []),
    }

    ai_suggestions_row = {
        "email": email,
        "suggestions": result.get("suggestions", []),
    }

    supabase.table("resume_analysis").upsert(
        resume_analysis_row,
        on_conflict="email"
    ).execute()

    supabase.table("resume_data").upsert(
        resume_data_row,
        on_conflict="email"
    ).execute()

    supabase.table("ai_suggestions").upsert(
        ai_suggestions_row,
        on_conflict="email"
    ).execute()

    return resume_analysis_row