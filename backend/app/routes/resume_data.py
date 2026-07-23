from fastapi import APIRouter
from app.database.db import supabase

router = APIRouter(
    prefix="/resume",
    tags=["Resume Data"]
)


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