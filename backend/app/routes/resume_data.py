from fastapi import APIRouter, Depends, HTTPException
from app.database.db import supabase
from app.utils.security import get_authenticated_email, require_self

router = APIRouter(
    prefix="/resume",
    tags=["Resume Data"]
)


@router.get("/data/{email}")
def get_resume_data(
    email: str,
    auth_email: str = Depends(get_authenticated_email),
):
    """
    Settings > Profile > Resume Management needs "Last Updated" for the
    current resume. profiles.resume_url has the file itself, but the
    timestamp already lives here on resume_data (kept in sync by
    run_profile_resume_analysis whenever the resume text actually
    changes) - so this just reads it rather than adding a duplicate
    timestamp column to profiles.
    """
    require_self(email, auth_email)

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
async def save_resume(
    data: dict,
    auth_email: str = Depends(get_authenticated_email),
):
    target_email = data.get("email")
    if not target_email:
        raise HTTPException(status_code=422, detail="email is required.")
    require_self(target_email, auth_email)

    response = (
        supabase.table("resume_data")
        .upsert(data)
        .execute()
    )

    return {
        "message": "Resume data saved",
        "data": response.data
    }