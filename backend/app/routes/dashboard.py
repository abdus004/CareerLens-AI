import os
import uuid

import requests
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from app.database.db import supabase
from app.services.resume_parser import extract_text
from app.services.profile_resume_analysis_service import run_profile_resume_analysis
from app.utils.security import get_authenticated_email, require_self
import json

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


def _backfill_ai_suggestions(email: str, resume_url: str) -> None:
    """
    Self-heals the gap described in profile_resume_analysis_service.py:
    resume_analysis, resume_data, and ai_suggestions are written as
    three separate upserts, so a partial failure on an earlier run can
    leave resume_analysis populated while ai_suggestions stays empty
    forever (the hash-match check used to skip regeneration without
    verifying ai_suggestions actually existed). That root cause is
    fixed there; this is what makes it self-heal automatically for
    anyone who already hit the gap, without asking them to manually
    re-upload their resume in Settings.

    Scheduled via BackgroundTasks below - runs AFTER the dashboard
    response has already been sent, so it never adds latency to a
    dashboard page load. Re-downloads the resume already on file,
    re-extracts its text, and re-runs the exact same analysis
    upload_resume() runs at upload time. Best-effort and silent on
    failure, same as the original call site in routes/resume.py.
    """
    temp_path = None
    try:
        response = requests.get(resume_url, timeout=20)
        response.raise_for_status()

        temp_path = f"temp_dashboard_backfill_{uuid.uuid4()}.pdf"
        with open(temp_path, "wb") as f:
            f.write(response.content)

        resume_text = extract_text(temp_path)
        if resume_text.strip():
            run_profile_resume_analysis(email, resume_text)
    except Exception as e:
        print(f"[dashboard] AI Suggestions backfill failed for {email}: {e}")
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


def _dedup_count(portfolio_items, resume_items, key):
    """
    Counts distinct items across Portfolio (manually entered) and
    Resume Data (extracted from the resume), matching on a case-
    insensitive comparison of `key` (e.g. "name" or "role") so the
    same project/internship entered in both places isn't counted
    twice.
    """
    seen = set()

    for item in (portfolio_items or []):
        value = (item.get(key) or "").strip().lower()
        if value:
            seen.add(value)

    for item in (resume_items or []):
        value = (item.get(key) or "").strip().lower()
        if value:
            seen.add(value)

    # Count entries that had no usable key separately so they aren't
    # silently dropped from the total.
    unkeyed = sum(
        1 for item in (portfolio_items or []) + (resume_items or [])
        if not (item.get(key) or "").strip()
    )

    return len(seen) + unkeyed


def _calculate_profile_strength(profile, resume_analysis_data):
    """
    Profile Strength as a percentage of real profile completeness
    signals. Replaces the previous frontend implementation
    (utils/profileScore.js), which was never wired up and operated on
    fields (resumeUploaded, atsKeywords, profilePhoto, etc.) that don't
    exist anywhere in the actual data model.
    """
    checks = [
        bool(profile.get("full_name")),
        bool(profile.get("phone")),
        bool(profile.get("college")) and bool(profile.get("department")),
        bool(profile.get("cgpa")),
        bool(profile.get("career_goal")),
        bool(profile.get("skills")),
        bool(profile.get("interests")),
        bool(profile.get("resume_url")),
        bool(profile.get("projects")) or bool(profile.get("internships")),
        bool(profile.get("certifications")),
        bool(resume_analysis_data),
    ]

    completed = sum(1 for c in checks if c)
    return round((completed / len(checks)) * 100)


@router.get("/{email}")
def get_dashboard(
    email: str,
    background_tasks: BackgroundTasks,
    auth_email: str = Depends(get_authenticated_email),
):
    require_self(email, auth_email)

    try:
        response = (
            supabase
            .table("profiles")
            .select("*")
            .eq("email", email)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Profile not found."
            )

        profile = response.data[0]

        # Convert JSON strings back to Python lists
        for field in [
            "career_goal", "skills", "interests",
            "projects", "internships", "certifications",
        ]:
            if profile.get(field):
                try:
                    profile[field] = json.loads(profile[field])
                except Exception:
                    profile[field] = []

        # -----------------------------------------------------------
        # Read-only lookups against the resume analysis tables. None
        # of this ever calls Gemini - it only reads whatever was
        # already generated and stored during Profile Setup / Resume
        # Upload (see profile_resume_analysis_service.py).
        # -----------------------------------------------------------

        resume_analysis_resp = (
            supabase
            .table("resume_analysis")
            .select("*")
            .eq("email", email)
            .maybe_single()
            .execute()
        )
        resume_analysis_data = (
            resume_analysis_resp.data
            if resume_analysis_resp and resume_analysis_resp.data
            else None
        )

        resume_data_resp = (
            supabase
            .table("resume_data")
            .select("*")
            .eq("email", email)
            .maybe_single()
            .execute()
        )
        resume_data = (
            resume_data_resp.data
            if resume_data_resp and resume_data_resp.data
            else {}
        )

        ai_suggestions_resp = (
            supabase
            .table("ai_suggestions")
            .select("*")
            .eq("email", email)
            .maybe_single()
            .execute()
        )
        ai_suggestions = (
            ai_suggestions_resp.data.get("suggestions", [])
            if ai_suggestions_resp and ai_suggestions_resp.data
            else []
        )

        # Self-heal: if there's genuinely nothing to show yet but a
        # resume is already on file, schedule a background backfill
        # (see _backfill_ai_suggestions above) rather than leaving the
        # AI Suggestions card empty indefinitely. This response still
        # returns immediately with whatever's currently stored - the
        # backfill only affects the NEXT load, once it completes.
        if not ai_suggestions and profile.get("resume_url"):
            background_tasks.add_task(
                _backfill_ai_suggestions, email, profile["resume_url"]
            )

        # -----------------------------------------------------------
        # Stats: Projects / Internships merged across Portfolio +
        # Resume Data (deduplicated), Skills from profile + skill
        # analysis, Profile Strength computed from real completeness.
        # -----------------------------------------------------------

        projects_count = _dedup_count(
            profile.get("projects"), resume_data.get("projects"), "name"
        )
        internships_count = _dedup_count(
            profile.get("internships"), resume_data.get("experience"), "role"
        )

        profile_skills = set(profile.get("skills") or [])
        resume_data_skills = set(resume_data.get("skills") or [])
        skills_count = len(profile_skills | resume_data_skills)

        profile_strength = _calculate_profile_strength(
            profile, resume_analysis_data
        )

        stats = {
            "projects_count": projects_count,
            "internships_count": internships_count,
            "skills_count": skills_count,
            "profile_strength": profile_strength,
        }

        return {
            "success": True,
            "data": profile,
            "stats": stats,
            "resume_analysis": resume_analysis_data,
            "ai_suggestions": ai_suggestions,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )