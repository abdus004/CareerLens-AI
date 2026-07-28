from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.database.db import supabase
import json
import logging

router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)
logger = logging.getLogger(__name__)


class ProfileCreate(BaseModel):
    full_name: str
    email: str
    phone: str
    gender: str
    age: int

    linkedin: str
    github: str

    college: str
    department: str
    degree: str
    year: str
    cgpa: str

    career_goal: List[str]
    skills: List[str]
    interests: List[str]

    resume_url: str = ""


@router.post("/")
def create_profile(profile: ProfileCreate):

    try:
        logger.info(f"Saving profile: {profile.email}")
        data = profile.model_dump()

        # Convert lists to JSON strings
        data["career_goal"] = json.dumps(data["career_goal"])
        data["interests"] = json.dumps(data["interests"])

        # Check whether profile already exists
        existing = (
            supabase
            .table("profiles")
            .select("skills")
            .eq("email", data["email"])
            .execute()
        )

        if existing.data:
# Always save the latest profile skills entered by the user.
# Resume skills should be stored separately (resume_skills column)
# and merged later during Skill Analysis.
            data["skills"] = json.dumps(data["skills"])

           

            response = (
                supabase
                .table("profiles")
                .update(data)
                .eq("email", data["email"])
                .execute()
            )

        else:

            # First time profile creation
            data["skills"] = json.dumps(data["skills"])

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

    except Exception as e:
        logger.exception(f"Profile save failed: {profile.email}")
        
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )