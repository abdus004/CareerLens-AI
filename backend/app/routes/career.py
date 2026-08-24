from fastapi import APIRouter, Depends, HTTPException
from app.database.db import supabase
from app.ai.gemini import generate_json
from app.ai.prompts import career_recommendation_prompt
from app.services.learning_path_service import generate_learning_path
from app.services.certificate_bonus_service import get_certificate_bonus, apply_bonus
from app.services.notification_service import create_notification
from app.utils.security import get_authenticated_email, require_self
from app.utils.errors import raise_clean_500
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/career",
    tags=["Career"]
)


def generate_career_analysis(email: str):
    """
    Generates career analysis and saves it into career_analysis table.
    """

    # maybe_single() (not single()) so a missing profile falls through
    # to the "not found" check below, rather than single() raising an
    # APIError before that check is ever reached - which previously
    # turned a legitimate 404 into a generic 500. Note maybe_single()
    # returns None itself (not a response object with .data=None) when
    # zero rows match, per postgrest-py - `if not response` below
    # handles that, matching the guard pattern already used correctly
    # in routes/dashboard.py's own maybe_single() calls.
    response = (
        supabase
        .table("profiles")
        .select("*")
        .eq("email", email)
        .maybe_single()
        .execute()
    )

    if not response or not response.data:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    profile = response.data

    # Convert JSON strings back to Python objects
    for field in [
        "career_goal", "interests", "skills",
        "projects", "internships", "certifications",
    ]:
        if profile.get(field):
            try:
                profile[field] = json.loads(profile[field])
            except Exception:
                pass

    # Generate Prompt
    prompt = career_recommendation_prompt(profile)

    # Not print() - this prompt contains the full user profile (name,
    # education, skills, etc.), and career_analysis results similarly.
    # Both are silent by default (only emitted if the app's logging
    # level is explicitly set to DEBUG), matching the same fix already
    # applied to resume.py's resume-text logging.
    logger.debug("Career prompt sent to Gemini for %s:\n%s", email, prompt)

    # Generate AI response
    result = generate_json(prompt)

    logger.debug("Gemini career response for %s: %s", email, result)

    # Save into career_analysis table
    existing = (
        supabase
        .table("career_analysis")
        .select("id")
        .eq("email", email)
        .execute()
    )

    if existing.data:
        (
            supabase
            .table("career_analysis")
            .update(
                {
                    "analysis": result
                }
            )
            .eq("email", email)
            .execute()
        )
    else:
        (
            supabase
            .table("career_analysis")
            .insert(
                {
                    "email": email,
                    "analysis": result
                }
            )
            .execute()
        )

    # Best-effort - see notification_service.py. Fires only once the
    # career analysis itself has actually been saved above.
    create_notification(
        email=email,
        notif_type="career",
        title="Career recommendations updated",
        message="Your top career recommendations have changed.",
        link="/career-intelligence",
    )

    learning_path = generate_learning_path(
        result["recommended_role"],
        profile["skills"]
    )

    supabase.table("learning_paths").upsert(
        {
            "email": email,
            "role": learning_path["role"],
            "learning_path": learning_path["learning_path"]
        }
    ).execute()

    create_notification(
        email=email,
        notif_type="learning_path",
        title="Learning path updated",
        message="Your personalized learning path has been refreshed.",
        link="/learning-path",
    )

    return result


@router.post("/analyze/{email}")
def analyze_career(
    email: str,
    auth_email: str = Depends(get_authenticated_email),
):
    require_self(email, auth_email)

    try:
        return generate_career_analysis(email)

    except HTTPException:
        raise

    except Exception as e:
        raise_clean_500(e)


@router.get("/{email}")
def get_career_analysis(
    email: str,
    auth_email: str = Depends(get_authenticated_email),
):
    require_self(email, auth_email)

    try:

        response = (
            supabase
            .table("career_analysis")
            .select("*")
            .eq("email", email)
            .maybe_single()
            .execute()
        )

        if not response or not response.data:
            raise HTTPException(
                status_code=404,
                detail="Career analysis not found"
            )

        # The stored analysis itself is never modified - a small,
        # deterministic bonus for career-relevant completed
        # certificates is layered on top only in this response. See
        # services/certificate_bonus_service.py.
        analysis = dict(response.data["analysis"] or {})
        bonus_info = get_certificate_bonus(email)
        if bonus_info["bonus"]:
            analysis["match_score"] = apply_bonus(analysis.get("match_score"), bonus_info["bonus"])
        analysis["certificate_bonus"] = bonus_info["bonus"]
        analysis["relevant_certificate_count"] = bonus_info["relevant_certificate_count"]

        return analysis

    except HTTPException:
        raise

    except Exception as e:
        raise_clean_500(e)