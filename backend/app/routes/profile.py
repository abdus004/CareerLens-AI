from fastapi import APIRouter, HTTPException, Depends
from app.database.db import supabase
from app.models.profile import ProfileCreate
from app.utils.security import get_authenticated_email, require_self
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

        # Convert lists to JSON strings
        data["career_goal"] = json.dumps(data["career_goal"])
        data["interests"] = json.dumps(data["interests"])
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

        return {
            "success": True,
            "message": "Profile saved successfully",
            "data": response.data
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
