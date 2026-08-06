from fastapi import APIRouter
from app.database.db import supabase

router = APIRouter(
    prefix="/resume",
    tags=["Resume Data"]
)


@router.get("/data/{email}")
def get_resume_data(email: str):
    """
    Settings > Profile > Resume Management needs "Last Updated" for the
    current resume. profiles.resume_url has the file itself, but the
    timestamp already lives here on resume_data (kept in sync by
    run_profile_resume_analysis whenever the resume text actually
    changes) - so this just reads it rather than adding a duplicate
    timestamp column to profiles.
    """
    response = (
        supabase.table("resume_data")
        .select("updated_at")
        .eq("email", email)
        .maybe_single()
        .execute()
    )

    return {
        "success": True,
        "data": response.data if response else None,
    }


@router.post("/save")
async def save_resume(data: dict):

    response = (
        supabase.table("resume_data")
        .upsert(data)
        .execute()
    )

    return {
        "message": "Resume data saved",
        "data": response.data
    }