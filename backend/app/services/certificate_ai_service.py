"""
The only two Gemini call sites in the Certificates feature:

  1. extract_certificate_fields  - reads an uploaded certificate file
     (image or PDF) and returns structured fields, for the Upload
     Certificate "AI Extraction" flow (Section 1 + Section 3
     completion).
  2. assess_certificate_relevance - decides whether a certificate is
     relevant to the student's own career path, so irrelevant
     certificates never get to silently inflate Skill Analysis /
     Career Readiness / Job Recommendations downstream.

Kept deliberately separate from user_certificate_service.py (which
documents itself as "Zero Gemini calls anywhere in this file") so that
module stays pure CRUD/storage, and from certificate_recommendation_service.py
(the Top-5 AI recommendations engine, an unrelated Gemini call site).
Both functions here reuse the exact same ai/gemini.py client - no new
client, no new key-rotation/failover system.

Both fail soft: if Gemini is unavailable or returns something
unusable, the caller gets an empty/neutral result back rather than an
exception, so a flaky AI call never blocks the user from saving a
certificate they already told us about.
"""

from app.ai.gemini import generate_json, generate_json_from_file
from app.ai.prompts import certificate_extraction_prompt, certificate_relevance_prompt
from app.database.db import supabase

EMPTY_EXTRACTION = {
    "certificate_name": "",
    "provider": "",
    "issue_date": "",
    "category": "",
    "confidence": {
        "certificate_name": False,
        "provider": False,
        "issue_date": False,
        "category": False,
    },
}

VALID_CATEGORIES = {
    "Cloud", "Programming", "Data Science", "AI/ML", "Database",
    "DevOps", "Web Development", "Cybersecurity", "Networking", "Other",
}


def extract_certificate_fields(file_bytes: bytes, content_type: str) -> dict:
    try:
        result = generate_json_from_file(
            certificate_extraction_prompt(), file_bytes, content_type
        )
    except Exception:
        # Extraction failing just means the user falls back to typing
        # the fields in manually - never a hard error on upload.
        return dict(EMPTY_EXTRACTION)

    if not isinstance(result, dict):
        return dict(EMPTY_EXTRACTION)

    if result.get("category") not in VALID_CATEGORIES:
        result["category"] = ""
        if isinstance(result.get("confidence"), dict):
            result["confidence"]["category"] = False

    for field in ("certificate_name", "provider", "issue_date", "category"):
        result.setdefault(field, "")
    if not isinstance(result.get("confidence"), dict):
        result["confidence"] = dict(EMPTY_EXTRACTION["confidence"])

    return result


def _load_career_context(email: str) -> dict:
    """
    Best-effort context for the relevance prompt - profile.career_goal
    plus Career Intelligence's recommended_role, the same two fields
    job_matching_service and drive_matching_service already treat as
    authoritative for "what is this student aiming for." Returns an
    empty dict (not an error) if either is missing - the caller treats
    that as "not enough context to judge relevance."
    """
    context = {}

    profile_res = (
        supabase.table("profiles")
        .select("career_goal, department, skills")
        .eq("email", email)
        .maybe_single()
        .execute()
    )
    if profile_res and profile_res.data:
        context["career_goal"] = profile_res.data.get("career_goal")
        context["department"] = profile_res.data.get("department")
        context["current_skills"] = profile_res.data.get("skills")

    career_res = (
        supabase.table("career_analysis")
        .select("analysis")
        .eq("email", email)
        .maybe_single()
        .execute()
    )
    if career_res and career_res.data:
        analysis = career_res.data.get("analysis") or {}
        context["recommended_role"] = analysis.get("recommended_role")

    return context


def assess_certificate_relevance(email: str, certificate_name: str, provider: str, category: str) -> dict:
    """
    Returns {"career_relevant": bool, "relevance_note": str}. Defaults
    to NOT relevant (never the reverse) whenever there isn't enough
    career context to judge, or Gemini fails - per the product spec,
    an irrelevant/unassessed certificate must never be treated as
    boosting the student's score, so "unknown" and "not relevant" are
    handled identically downstream.
    """
    career_context = _load_career_context(email)

    if not career_context.get("career_goal") and not career_context.get("recommended_role"):
        return {"career_relevant": False, "relevance_note": ""}

    certificate = {
        "certificate_name": certificate_name,
        "provider": provider,
        "category": category,
    }

    try:
        result = generate_json(certificate_relevance_prompt(career_context, certificate))
    except Exception:
        return {"career_relevant": False, "relevance_note": ""}

    if not isinstance(result, dict):
        return {"career_relevant": False, "relevance_note": ""}

    return {
        "career_relevant": bool(result.get("career_relevant", False)),
        "relevance_note": str(result.get("relevance_note") or ""),
    }
