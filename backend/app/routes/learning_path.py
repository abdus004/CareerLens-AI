from fastapi import APIRouter, HTTPException, Query
from app.database.db import supabase
from app.services.learning_path_service import (
    generate_learning_path,
    get_or_generate_topic_details,
)
import json

router = APIRouter(
    prefix="/learning-path",
    tags=["Learning Path"]
)


@router.get("/{email}")
def get_learning_path(email: str):

    try:

        # -----------------------------
        # Check if learning path exists
        # -----------------------------
        saved_path = (
            supabase
            .table("learning_paths")
            .select("*")
            .eq("email", email)
            .execute()
        )

        if saved_path.data:
            return {
                "role": saved_path.data[0]["role"],
                "learning_path": saved_path.data[0]["learning_path"]
            }

        # -----------------------------
        # Fetch profile
        # -----------------------------
        profile = (
            supabase
            .table("profiles")
            .select("skills")
            .eq("email", email)
            .single()
            .execute()
        )

        if not profile.data:
            raise HTTPException(
                status_code=404,
                detail="Profile not found"
            )

        skills = json.loads(profile.data["skills"])

        # -----------------------------
        # Fetch career analysis
        # -----------------------------
        career = (
            supabase
            .table("career_analysis")
            .select("analysis")
            .eq("email", email)
            .single()
            .execute()
        )

        if not career.data:
            raise HTTPException(
                status_code=404,
                detail="Career analysis not found"
            )

        analysis = career.data["analysis"]
        recommended_role = analysis["recommended_role"]

        # -----------------------------
        # Generate learning path
        # -----------------------------
        learning_path = generate_learning_path(
            recommended_role,
            skills
        )

        # -----------------------------
        # Save to Supabase
        # -----------------------------
        supabase.table("learning_paths").insert({
            "email": email,
            "role": learning_path["role"],
            "learning_path": learning_path["learning_path"]
        }).execute()

        return learning_path

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/{email}/topic-details")
def get_topic_details(email: str, skill: str = Query(...)):
    """
    Powers "Start Learning". Looks the requested skill up inside THIS
    student's own saved learning path (never trusts a client-supplied
    role/level/duration directly - that would let a client generate
    content for an arbitrary/invented role), then serves the matching
    (role, skill) detail guide - generating it via Gemini exactly once
    ever if it doesn't already exist yet, see
    learning_path_service.get_or_generate_topic_details.
    """
    try:
        saved_path = (
            supabase
            .table("learning_paths")
            .select("*")
            .eq("email", email)
            .execute()
        )

        if not saved_path.data:
            raise HTTPException(
                status_code=404,
                detail="Learning path not found. Visit Learning Path first."
            )

        role = saved_path.data[0]["role"]
        steps = saved_path.data[0]["learning_path"] or []

        matching_step = next(
            (s for s in steps if str(s.get("skill", "")).strip().lower() == skill.strip().lower()),
            None,
        )

        if not matching_step:
            raise HTTPException(
                status_code=404,
                detail="This skill is not part of your current learning path."
            )

        details = get_or_generate_topic_details(
            role=role,
            skill=matching_step["skill"],
            level=matching_step.get("level", "Beginner"),
            duration=matching_step.get("duration", "2 Weeks"),
        )

        return {
            "role": role,
            "skill": matching_step["skill"],
            "level": matching_step.get("level"),
            "duration": matching_step.get("duration"),
            "status": matching_step.get("status"),
            "progress": matching_step.get("progress"),
            "details": details,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )