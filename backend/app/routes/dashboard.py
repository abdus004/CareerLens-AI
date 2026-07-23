from fastapi import APIRouter, HTTPException
from app.database.db import supabase
import json

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/{email}")
def get_dashboard(email: str):

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
        for field in ["career_goal", "skills", "interests"]:
            if profile.get(field):
                try:
                    profile[field] = json.loads(profile[field])
                except Exception:
                    profile[field] = []

        return {
            "success": True,
            "data": profile
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )