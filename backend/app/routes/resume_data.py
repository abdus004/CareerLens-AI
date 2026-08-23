from typing import Any, List

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.database.db import supabase
from app.utils.security import get_authenticated_email, require_self

router = APIRouter(
    prefix="/resume",
    tags=["Resume Data"]
)


class ResumeDataUpdate(BaseModel):
    """
    Every field the resume_data table actually stores - matches
    resume_data_row in services/profile_resume_analysis_service.py,
    the only other writer of this table. Listed explicitly so a caller
    can only ever set THESE columns, never an arbitrary one.

    Previously this endpoint took a raw, untyped `dict` and upserted it
    verbatim - any key the client sent (including internal columns
    like resume_hash or updated_at, which live on other tables/are
    server-managed here) would have been written straight into the
    row. This is a mass-assignment fix, not a route this app's own
    frontend currently calls (confirmed via a repo-wide search) - it's
    reachable by anything that calls the API directly, so it's worth
    closing off properly rather than leaving it as-is because nothing
    happens to use it today.
    """
    email: str
    skills: List[str] = []
    projects: List[dict] = []
    education: List[dict] = []
    experience: List[dict] = []
    certifications: List[Any] = []
    languages: List[str] = []


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
    payload: ResumeDataUpdate,
    auth_email: str = Depends(get_authenticated_email),
):
    require_self(payload.email, auth_email)

    response = (
        supabase.table("resume_data")
        .upsert(payload.model_dump(), on_conflict="email")
        .execute()
    )

    return {
        "message": "Resume data saved",
        "data": response.data
    }