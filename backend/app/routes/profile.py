from fastapi import APIRouter, HTTPException, Depends
from app.database.db import supabase
from app.models.profile import ProfileCreate
from app.utils.security import get_authenticated_email, require_self
from app.services.skill_unification_service import build_unified_skills
import json
import logging

router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)
logger = logging.getLogger(__name__)


@router.post("/")
def create_profile(
    profile: ProfileCreate,
    auth_email: str = Depends(get_authenticated_email),
):
    # The request body still carries `email` (unchanged API shape, so
    # the frontend didn't need to stop sending it) but it is no longer
    # trusted on its own - it must match whoever the session token
    # actually belongs to. See app/utils/security.py.
    require_self(profile.email, auth_email)

    try:
        logger.info(f"Saving profile: {profile.email}")
        data = profile.model_dump()

        # `skills` here is what the Skills step of Profile Setup (or a
        # future skills editor) actually submitted - the
        # PROFILE-selected side of the unified skill set. Stored
        # verbatim into profile_selected_skills (jsonb) so it survives
        # independently of whatever the current resume contributes;
        # build_unified_skills() below is what merges the two into the
        # deduplicated, technical-only profiles.skills every other
        # module reads. This is the fix for the previous bug where
        # uploading a resume silently overwrote/erased profile-selected
        # skills (they're never touched by a resume upload now, only
        # merged with it).
        profile_selected_skills = data["skills"]
        data["profile_selected_skills"] = profile_selected_skills

        # Convert lists to JSON strings
        data["career_goal"] = json.dumps(data["career_goal"])
        data["interests"] = json.dumps(data["interests"])
        # Placeholder write only - build_unified_skills() overwrites
        # this immediately below with the real profile+resume merge,
        # so profile.skills is never left as "profile-selected only"
        # even momentarily after the response above is read elsewhere.
        data["skills"] = json.dumps(data["skills"])

        # Check whether profile already exists
        existing = (
            supabase
            .table("profiles")
            .select("skills")
            .eq("email", data["email"])
            .execute()
        )

        if existing.data:
            response = (
                supabase
                .table("profiles")
                .update(data)
                .eq("email", data["email"])
                .execute()
            )

        else:
            # First time profile creation
            response = (
                supabase
                .table("profiles")
                .insert(data)
                .execute()
            )

        # Recompute the unified (profile ∪ current-resume, deduplicated,
        # technical-only) skill set now that profile_selected_skills has
        # changed. Reuses whatever resume_skills is already on file (a
        # fresh signup has none yet; an existing user's current resume
        # skills are preserved and merged in, not overwritten).
        unified = build_unified_skills(data["email"])

        response_data = response.data
        if response_data:
            response_data[0]["skills"] = unified["unified_skills"]
            response_data[0]["profile_selected_skills"] = profile_selected_skills
            response_data[0]["resume_skills"] = unified["resume_skills"]

        return {
            "success": True,
            "message": "Profile saved successfully",
            "data": response_data
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.exception(f"Profile save failed: {profile.email}")

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/{email}")
def get_profile(
    email: str,
    auth_email: str = Depends(get_authenticated_email),
):
    """
    Read counterpart to POST /profile/. Used by Settings (Profile
    section) and by the global profile context
    (frontend/src/context/ProfileContext.jsx) so the Navbar
    avatar/name can be populated without waiting on a full
    /dashboard/{email} call. Same JSON-string-to-list decoding already
    used by dashboard.py / skills.py / career.py / jobs.py.
    """
    require_self(email, auth_email)

    try:
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
                detail="Profile not found."
            )

        profile = response.data

        for field in [
            "career_goal", "skills", "interests",
            "projects", "internships", "certifications",
        ]:
            if profile.get(field):
                try:
                    profile[field] = json.loads(profile[field])
                except Exception:
                    profile[field] = []
            else:
                profile[field] = []

        return {
            "success": True,
            "data": profile,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
