from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.database.db import supabase
import json

router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)


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

            # Preserve resume extracted skills if they already exist
            existing_skills = existing.data[0]["skills"]

            if existing_skills:
                data["skills"] = existing_skills
            else:
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
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )