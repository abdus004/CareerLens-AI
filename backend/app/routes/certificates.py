from typing import Optional
import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from postgrest.exceptions import APIError

from app.database.db import supabase
from app.models.certificates import UpdateProgressRequest
from app.services import (
    certificate_ai_service,
    certificate_recommendation_service,
    user_certificate_service,
)
from app.utils.security import get_authenticated_email, require_self

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/certificates",
    tags=["Certificates"],
)


def _raise_clean_500(e: Exception):
    """
    Never surface a raw Supabase/Postgres error (a Python dict repr
    like {'message': ..., 'code': '23514', 'hint': ..., 'details': ...})
    directly to the user - the frontend displays HTTPException.detail
    verbatim in an error banner, so anything raised here IS what the
    user sees. The real error is always logged server-side either way,
    so nothing is lost for debugging - it just isn't shown raw in the UI.
    """
    if isinstance(e, APIError):
        logger.error("Supabase error in certificates route: %s", e.json() if hasattr(e, "json") else e)
        raise HTTPException(
            status_code=500,
            detail="Something went wrong saving that. Please try again in a moment.",
        )
    logger.exception("Unexpected error in certificates route")
    raise HTTPException(status_code=500, detail="Something went wrong. Please try again.")


@router.get("/")
def list_certificates(email: str, auth_email: str = Depends(get_authenticated_email)):
    """
    Powers the CareerLens Certificates section of the Certification
    Dashboard. Only ever reads already-issued certificates rows -
    issuance itself happens exclusively through
    POST /skill-assessment/{assessment_id}/certificate, which verifies
    eligibility server-side before a row is ever created.

    UNCHANGED from before this feature - the My Certificates and
    Recommended Certifications sections are powered entirely by the new
    endpoints below.
    """
    require_self(email, auth_email)

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
        _raise_clean_500(e)


# =====================================================================
# SECTION 1 - MY CERTIFICATES (externally uploaded certifications)
# =====================================================================

CERTIFICATE_CATEGORIES = {
    "Cloud", "Programming", "Data Science", "AI/ML", "Database",
    "DevOps", "Web Development", "Cybersecurity", "Networking", "Other",
}

ALLOWED_UPLOAD_CONTENT_TYPES = {
    "application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp",
}


@router.post("/extract")
async def extract_certificate(
    file: UploadFile = File(...),
    auth_email: str = Depends(get_authenticated_email),
):
    """
    Step 1 of the Upload Certificate "AI Extraction" flow (see
    certificate_ai_service.extract_certificate_fields, which reuses the
    existing Gemini client - no second client/system). Reads the file
    and returns extracted fields plus a per-field confidence flag; it
    does NOT save anything - the user still confirms/corrects the
    result before POST /certificates/my actually persists it. Safe to
    call as often as the user re-uploads a different file; nothing here
    is cached, since re-extracting the same file twice is a normal part
    of "let me try a clearer photo" and isn't the repeated-Gemini-call
    pattern the product spec warns against (that's about not
    regenerating unchanged AI *recommendations*, not about skipping a
    user-initiated read of a brand new file).

    Requires authentication (auth_email is otherwise unused - there's
    no email-owned resource here, nothing is persisted by this route)
    purely so this can't be called by a logged-out client to run up
    Gemini usage for free. The frontend already sends the auth header
    on this call via the shared `api` client, so this is a backend-only
    fix with no frontend change needed.
    """
    if file.content_type not in ALLOWED_UPLOAD_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF or image file (PNG, JPG, or WEBP).",
        )

    try:
        file_bytes = await file.read()
        extracted = certificate_ai_service.extract_certificate_fields(
            file_bytes, file.content_type
        )
        return {"success": True, "data": extracted}
    except Exception as e:
        _raise_clean_500(e)


@router.get("/my")
def get_my_certificates(email: str, auth_email: str = Depends(get_authenticated_email)):
    """
    Lists ONLY the externally uploaded certificates for this email
    (Google, AWS, Coursera, etc. - plus any completed AI-recommended
    certifications, which graduate into this same list). Never
    includes CareerLens Skill Assessment certificates - those stay
    exclusively in GET /certificates/ above.
    """
    require_self(email, auth_email)

    try:
        data = user_certificate_service.list_user_certificates(email)
        return {"success": True, "data": data}
    except Exception as e:
        _raise_clean_500(e)


@router.post("/my")
async def upload_my_certificate(
    email: str = Form(...),
    certificate_name: Optional[str] = Form(None),
    provider: Optional[str] = Form(None),
    issue_date: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    file: UploadFile = File(...),
    auth_email: str = Depends(get_authenticated_email),
):
    """
    Uploads an external certificate (PDF or image) and adds it to My
    Certificates. Independent of the Skill Assessment certificate flow
    and of Recommended Certifications - this is purely a user-supplied
    record.

    Certificate File is the ONLY required field. certificate_name,
    provider, issue_date and category are all optional - user_certificate_service
    fills in sensible defaults (filename-derived name, "Not specified"
    provider, NULL issue date, "Other" category) so an empty value here
    never causes a 422 or a Supabase constraint error.
    """
    require_self(email, auth_email)

    if category is not None and category not in CERTIFICATE_CATEGORIES:
        category = "Other"

    if file.content_type not in ALLOWED_UPLOAD_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF or image file (PNG, JPG, or WEBP).",
        )

    try:
        file_bytes = await file.read()

        # Relevance is assessed against the FINAL, user-confirmed
        # fields (not the raw AI extraction), since the user may have
        # corrected them - see certificate_ai_service.assess_certificate_relevance.
        # This never blocks the save: on any failure it defaults to
        # "not relevant", matching the spec's "do NOT artificially
        # increase scores" default.
        relevance = certificate_ai_service.assess_certificate_relevance(
            email=email,
            certificate_name=(certificate_name or "").strip() or "Untitled Certificate",
            provider=(provider or "").strip() or "Not specified",
            category=(category or "").strip() or "Other",
        )

        row = user_certificate_service.add_user_certificate(
            email=email,
            certificate_name=certificate_name,
            provider=provider,
            issue_date=issue_date,
            category=category,
            file_bytes=file_bytes,
            original_filename=file.filename or "certificate",
            content_type=file.content_type,
            career_relevant=relevance["career_relevant"],
            relevance_note=relevance["relevance_note"],
        )
        return {"success": True, "data": row}
    except HTTPException:
        raise
    except Exception as e:
        _raise_clean_500(e)


@router.delete("/my/{certificate_id}")
def delete_my_certificate(
    certificate_id: str,
    email: str,
    auth_email: str = Depends(get_authenticated_email),
):
    """
    Deletes one externally uploaded certificate from My Certificates.
    Ownership is verified server-side in user_certificate_service - a
    user cannot delete another account's certificate just by knowing
    its id. There is no equivalent endpoint for CareerLens certificates;
    they are never deletable.
    """
    require_self(email, auth_email)

    try:
        user_certificate_service.delete_user_certificate(certificate_id, email)
        return {"success": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        _raise_clean_500(e)


# =====================================================================
# SECTION 3 - RECOMMENDED CERTIFICATIONS (AI powered, generated once)
# =====================================================================


@router.get("/recommendations")
def get_recommendations(email: str, auth_email: str = Depends(get_authenticated_email)):
    """
    Reads the persisted Top-5 AI recommendations for this email,
    generating them with a single Gemini call the first time this is
    called for this email (only once Resume Analysis + Skill Analysis
    have both completed) - see certificate_recommendation_service for
    the full one-time-generation guarantee.
    """
    require_self(email, auth_email)

    try:
        result = certificate_recommendation_service.get_or_generate_recommendations(email)
        return {"success": True, **result}
    except Exception as e:
        _raise_clean_500(e)


@router.put("/recommendations/{recommendation_id}/progress")
def update_recommendation_progress(
    recommendation_id: str,
    payload: UpdateProgressRequest,
    auth_email: str = Depends(get_authenticated_email),
):
    """Manually updates progress (any whole value 0-100) for one recommendation."""
    require_self(payload.email, auth_email)

    try:
        row = user_certificate_service.update_progress(
            recommendation_id, payload.email, payload.progress_percent
        )
        return {"success": True, "data": row}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        _raise_clean_500(e)


@router.post("/recommendations/{recommendation_id}/complete")
async def complete_recommendation(
    recommendation_id: str,
    email: str = Form(...),
    certificate_name: str = Form(...),
    provider: str = Form(...),
    issue_date: str = Form(...),
    file: UploadFile = File(...),
    auth_email: str = Depends(get_authenticated_email),
):
    """
    Only reachable once progress has reached 100% (enforced server-side
    in the service, not trusted from the client). Uploads the
    certificate, moves it into My Certificates, and removes the
    recommendation from Recommended Certifications.
    """
    require_self(email, auth_email)

    if file.content_type not in ALLOWED_UPLOAD_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF or image file (PNG, JPG, or WEBP).",
        )

    try:
        file_bytes = await file.read()
        row = user_certificate_service.complete_recommendation(
            recommendation_id=recommendation_id,
            email=email,
            certificate_name=certificate_name,
            provider=provider,
            issue_date=issue_date,
            file_bytes=file_bytes,
            original_filename=file.filename or "certificate",
            content_type=file.content_type,
            # A completed Recommended Certification is relevant by
            # construction - certificate_recommendation_service only
            # ever generates recommendations targeted at this exact
            # student's career path, so re-asking Gemini to judge
            # relevance here would be a duplicate call the spec
            # explicitly warns against ("Do NOT unnecessarily call
            # Gemini if the existing... system can perform" the job).
            career_relevant=True,
            relevance_note="Completed from your personalized certificate recommendations.",
        )
        return {"success": True, "data": row}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        _raise_clean_500(e)