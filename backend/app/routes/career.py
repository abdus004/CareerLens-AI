from fastapi import APIRouter, HTTPException
from app.database.db import supabase
from app.ai.gemini import generate_json
from app.ai.prompts import career_recommendation_prompt
from app.services.learning_path_service import generate_learning_path
import json

router = APIRouter(
    prefix="/career",
    tags=["Career"]
)


def generate_career_analysis(email: str):
    """
    Generates career analysis and saves it into career_analysis table.
    """

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

    print("\n" + "=" * 100)
    print("CAREER PROMPT SENT TO GEMINI")
    print("=" * 100)
    print(prompt)
    print("=" * 100)

    # Generate AI response
    result = generate_json(prompt)

    print("\n" + "=" * 100)
    print("GEMINI RESPONSE")
    print("=" * 100)
    print(result)
    print("=" * 100)

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
    

    return result


@router.post("/analyze/{email}")
def analyze_career(email: str):

    try:
        return generate_career_analysis(email)

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/{email}")
def get_career_analysis(email: str):

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

        return response.data["analysis"]

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )