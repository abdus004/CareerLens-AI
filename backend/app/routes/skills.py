from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict
import json
from app.routes.career import generate_career_analysis
from app.database.db import supabase
from app.ai.gemini import generate_json
from app.ai.prompts import skill_analysis_prompt

router = APIRouter(
    prefix="/skills",
    tags=["Skills"]
)


class SkillLevelsUpdate(BaseModel):
    skill_levels: Dict[str, int]


@router.put("/{email}")
def update_skill_levels(email: str, request: SkillLevelsUpdate):
    try:

        # Check if profile exists
        response = (
            supabase
            .table("profiles")
            .select("email")
            .eq("email", email)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Profile not found."
            )

        # Save edited skill levels
        (
            supabase
            .table("profiles")
            .update(
                {
                    "skill_levels": request.skill_levels
                }
            )
            .eq("email", email)
            .execute(),
            generate_career_analysis(email)
            
        )

        return {
            "success": True,
            "message": "Skill levels updated successfully.",
            "skill_levels": request.skill_levels
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/analyze/{email}")
def analyze_skills(email: str):

    try:

        # Fetch profile
        response = (
            supabase
            .table("profiles")
            .select("*")
            .eq("email", email)
            .single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Profile not found."
            )

        profile = response.data

        # Convert JSON strings back into Python objects
        for field in ["career_goal", "interests", "skills"]:
            if profile.get(field):
                try:
                    profile[field] = json.loads(profile[field])
                except Exception:
                    pass

        # Generate AI Skill Analysis
        prompt = skill_analysis_prompt(profile)
        result = generate_json(prompt)

        # -----------------------------------------
        # Save AI skill scores into profiles table
        # -----------------------------------------

        skill_levels = {}

        for skill in result.get("technical_skills", []):
            skill_levels[skill["skill"]] = skill["score"]

        (
            supabase
            .table("profiles")
            .update(
                {
                    "skill_levels": skill_levels
                }
            )
            .eq("email", email)
            .execute()
        )

        # -----------------------------------------
        # Save complete AI analysis
        # -----------------------------------------

        existing = (
            supabase
            .table("skill_analysis")
            .select("id")
            .eq("email", email)
            .execute()
        )

        if existing.data:

            (
                supabase
                .table("skill_analysis")
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
                .table("skill_analysis")
                .insert(
                    {
                        "email": email,
                        "analysis": result
                    }
                )
                .execute()
            )

        return result

    except HTTPException:
        raise

    except Exception as e:

        import traceback
        traceback.print_exc()   # <-- prints the real error in the terminal
        raise HTTPException(
            status_code=500,
            detail=str(e)
    )


@router.get("/{email}")
def get_skill_analysis(email: str):

    try:

        response = (
            supabase
            .table("skill_analysis")
            .select("*")
            .eq("email", email)
            .single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Skill analysis not found."
            )

        return response.data["analysis"]

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )