from fastapi import APIRouter, HTTPException
from app.database.db import supabase
from app.services.learning_path_service import generate_learning_path
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