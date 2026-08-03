from fastapi import APIRouter, HTTPException

from app.database.db import supabase

router = APIRouter(
    prefix="/certificates",
    tags=["Certificates"],
)


@router.get("/")
def list_certificates(email: str):
    """
    Powers the Certificates page. Only ever reads already-issued
    certificates rows - issuance itself happens exclusively through
    POST /skill-assessment/{assessment_id}/certificate, which verifies
    eligibility server-side before a row is ever created.
    """
    try:
        response = (
            supabase.table("certificates")
            .select("*")
            .eq("email", email)
            .order("issued_at", desc=True)
            .execute()
        )
        return {"success": True, "data": response.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
