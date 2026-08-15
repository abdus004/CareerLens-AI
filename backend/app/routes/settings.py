import uuid
import traceback

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, Depends
from pydantic import BaseModel

from app.database.db import supabase
from app.utils.security import get_authenticated_email, require_self

# Reused, not duplicated - see the module docstrings on each of these
# for why they're safe to call directly as plain Python functions
# outside of an HTTP request (FastAPI's @router decorators return the
# original function unchanged).
from app.routes.resume import upload_resume
from app.routes.skills import run_skill_analysis as analyze_skills
from app.routes.jobs import _generate_and_save_recommendations
from app.services.certificate_recommendation_service import reset_for_new_resume

router = APIRouter(
    prefix="/settings",
    tags=["Settings"]
)

AVATAR_BUCKET = "avatars"
USER_CERTIFICATES_BUCKET = "user-certificates"
RESUME_BUCKET = "resumes"
SUPPORT_ATTACHMENTS_BUCKET = "support-attachments"


# ------------------------------------------------------------------
# Shared helpers
# ------------------------------------------------------------------

def _delete_storage_object(bucket: str, public_url: str | None) -> None:
    """
    Best-effort cleanup only - a failure here should never block a
    profile update or account deletion that has already succeeded in
    the database. Parses the object path back out of the public URL
    Supabase Storage returns (the same get_public_url() shape used by
    routes/resume.py and services/user_certificate_service.py), since
    only the URL is persisted, not the raw storage path.
    """
    try:
        if not public_url:
            return
        marker = f"/object/public/{bucket}/"
        idx = public_url.find(marker)
        if idx == -1:
            return
        path = public_url[idx + len(marker):]
        if path:
            supabase.storage.from_(bucket).remove([path])
    except Exception:
        pass


def _get_profile_or_404(email: str) -> dict:
    response = (
        supabase
        .table("profiles")
        .select("*")
        .eq("email", email)
        .maybe_single()
        .execute()
    )
    if not response or not response.data:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return response.data


def _delete_all_user_data(email: str) -> None:
    """
    Deletes every row owned by this email, in FK-safe order (children
    before parents), across every table this project has. Deliberately
    does NOT touch shared/global tables: jobs, placement_drives,
    question_bank, assessment_question_bank, or the unrelated/unused
    legacy `users` table (auth lives entirely in Supabase Auth - see
    routes/auth.py, which never reads or writes `users`).
    """

    # --- Certificate recommendations (children first) ---
    supabase.table("certificate_progress").delete().eq("email", email).execute()
    supabase.table("certificate_recommendations").delete().eq("email", email).execute()
    supabase.table("certificate_recommendation_status").delete().eq("email", email).execute()

    # --- CareerLens certificates reference assessments - delete first ---
    supabase.table("certificates").delete().eq("email", email).execute()

    # --- My Certificates (uploaded files) ---
    my_certs = (
        supabase.table("user_certificates")
        .select("file_url")
        .eq("email", email)
        .execute()
    )
    for row in (my_certs.data or []):
        _delete_storage_object(USER_CERTIFICATES_BUCKET, row.get("file_url"))
    supabase.table("user_certificates").delete().eq("email", email).execute()

    # --- Skill Assessments + children ---
    assessment_ids = [
        row["id"] for row in (
            supabase.table("assessments").select("id").eq("email", email).execute().data or []
        )
    ]
    if assessment_ids:
        supabase.table("assessment_answers").delete().in_("assessment_id", assessment_ids).execute()
        supabase.table("assessment_results").delete().in_("assessment_id", assessment_ids).execute()
    supabase.table("assessments").delete().eq("email", email).execute()

    # --- Mock Interviews + children ---
    interview_ids = [
        row["id"] for row in (
            supabase.table("interviews").select("id").eq("email", email).execute().data or []
        )
    ]
    if interview_ids:
        supabase.table("interview_answers").delete().in_("interview_id", interview_ids).execute()
        supabase.table("interview_results").delete().in_("interview_id", interview_ids).execute()
    supabase.table("interviews").delete().eq("email", email).execute()

    # --- Job Recommendations ---
    supabase.table("job_match_explanations").delete().eq("email", email).execute()
    supabase.table("job_recommendations").delete().eq("email", email).execute()

    # --- Resume / Career / Skill derived data ---
    supabase.table("learning_paths").delete().eq("email", email).execute()
    supabase.table("ai_suggestions").delete().eq("email", email).execute()
    supabase.table("profile_resume_analysis").delete().eq("email", email).execute()
    supabase.table("skill_analysis").delete().eq("email", email).execute()
    supabase.table("career_analysis").delete().eq("email", email).execute()
    supabase.table("resume_analysis").delete().eq("email", email).execute()
    supabase.table("resume_data").delete().eq("email", email).execute()

    # --- Help & Support history ---
    tickets = (
        supabase.table("support_tickets")
        .select("attachment_url")
        .eq("email", email)
        .execute()
    )
    for row in (tickets.data or []):
        _delete_storage_object(SUPPORT_ATTACHMENTS_BUCKET, row.get("attachment_url"))
    supabase.table("support_tickets").delete().eq("email", email).execute()
    supabase.table("feedback").delete().eq("email", email).execute()

    # --- Profile itself, plus its own storage files ---
    profile_response = (
        supabase.table("profiles").select("avatar_url, resume_url").eq("email", email).maybe_single().execute()
    )
    if profile_response and profile_response.data:
        _delete_storage_object(AVATAR_BUCKET, profile_response.data.get("avatar_url"))
        _delete_storage_object(RESUME_BUCKET, profile_response.data.get("resume_url"))
    supabase.table("profiles").delete().eq("email", email).execute()


# ------------------------------------------------------------------
# Request models
# ------------------------------------------------------------------

class NotificationsUpdate(BaseModel):
    email: str
    notif_email_enabled: bool
    notif_job_alerts_enabled: bool
    notif_weekly_summary_enabled: bool


class ThemeUpdate(BaseModel):
    email: str
    theme_preference: str  # "dark" | "light"


class ChangePasswordRequest(BaseModel):
    email: str
    current_password: str
    new_password: str


class DeleteAccountRequest(BaseModel):
    email: str
    password: str


# ------------------------------------------------------------------
# Profile picture
# ------------------------------------------------------------------

@router.post("/avatar")
async def upload_avatar(
    email: str = Form(...),
    file: UploadFile = File(...),
    auth_email: str = Depends(get_authenticated_email),
):
    require_self(email, auth_email)
    try:
        if file.content_type and not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="Please upload an image file (PNG, JPG or WEBP)."
            )

        profile = _get_profile_or_404(email)
        old_avatar_url = profile.get("avatar_url")

        file_bytes = await file.read()

        ext = ""
        if file.filename and "." in file.filename:
            ext = "." + file.filename.rsplit(".", 1)[-1]
        filename = f"{uuid.uuid4()}{ext}"

        supabase.storage.from_(AVATAR_BUCKET).upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": file.content_type or "image/jpeg"},
        )
        public_url = supabase.storage.from_(AVATAR_BUCKET).get_public_url(filename)

        supabase.table("profiles").update(
            {"avatar_url": public_url}
        ).eq("email", email).execute()

        # Old file cleaned up only after the new one is safely saved.
        _delete_storage_object(AVATAR_BUCKET, old_avatar_url)

        return {"success": True, "avatar_url": public_url}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/avatar")
def remove_avatar(
    email: str = Query(...),
    auth_email: str = Depends(get_authenticated_email),
):
    require_self(email, auth_email)
    try:
        profile = _get_profile_or_404(email)

        _delete_storage_object(AVATAR_BUCKET, profile.get("avatar_url"))

        supabase.table("profiles").update(
            {"avatar_url": None}
        ).eq("email", email).execute()

        return {"success": True}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------------
# Resume replacement (cascades to every resume-dependent module)
# ------------------------------------------------------------------

@router.post("/resume/replace")
async def replace_resume(
    email: str = Form(...),
    file: UploadFile = File(...),
    auth_email: str = Depends(get_authenticated_email),
):
    """
    Full "Replace Resume" workflow described in the Settings spec:

      1-3. Upload + parse + make current  -> reuses upload_resume()
           (routes/resume.py) verbatim, so the standalone resume
           pipeline is never duplicated. This already regenerates the
           Dashboard-facing resume_analysis/resume_data/ai_suggestions
           (hash-based caching in profile_resume_analysis_service.py
           only calls Gemini when the resume text actually changed -
           which it always does here, since this is a brand new file).
      4-5. Regenerate resume-dependent modules -> Skill Analysis (which
           itself triggers Career Intelligence + Learning Path, see
           routes/career.py's generate_career_analysis), Job
           Recommendations, and a reset of Certificate Recommendations
           so the one-time Gemini call for that feature is allowed to
           run again against the new resume next time it's viewed.

    Each regeneration step is wrapped independently so a failure in
    one (e.g. a flaky Gemini response) never blocks the ones before or
    after it, or the resume upload itself, which is what the user is
    actually waiting on.
    """
    require_self(email, auth_email)
    try:
        # upload_resume is a FastAPI route function whose `auth_email`
        # parameter defaults to `Depends(get_authenticated_email)` -
        # that default is only ever resolved by FastAPI's own request
        # handling. Called directly like this as a plain function (no
        # HTTP request involved), that default is never resolved, so
        # `auth_email` inside upload_resume was literally the raw
        # `Depends(...)` object instead of a string - and the first
        # thing it does with it (require_self -> .strip()) crashed with
        # "'Depends' object has no attribute 'strip'". This request has
        # already authenticated as `auth_email` above via require_self,
        # so that same verified value is passed straight through.
        upload_result = await upload_resume(email=email, file=file, auth_email=auth_email)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    warnings = []

    try:
        analyze_skills(email)
    except HTTPException as e:
        warnings.append(f"Skill Analysis: {e.detail}")
    except Exception as e:
        traceback.print_exc()
        warnings.append(f"Skill Analysis: {e}")

    try:
        _generate_and_save_recommendations(email)
    except HTTPException as e:
        warnings.append(f"Job Recommendations: {e.detail}")
    except Exception as e:
        traceback.print_exc()
        warnings.append(f"Job Recommendations: {e}")

    try:
        reset_for_new_resume(email)
    except Exception as e:
        traceback.print_exc()
        warnings.append(f"Certificate Recommendations: {e}")

    return {
        "success": True,
        "message": "Resume replaced. Resume-dependent modules are refreshing.",
        "resume_url": upload_result.get("resume_url"),
        "skills": upload_result.get("skills"),
        "warnings": warnings,
    }


# ------------------------------------------------------------------
# Appearance (theme)
# ------------------------------------------------------------------

@router.put("/theme")
def update_theme(
    payload: ThemeUpdate,
    auth_email: str = Depends(get_authenticated_email),
):
    require_self(payload.email, auth_email)

    if payload.theme_preference not in ("dark", "light"):
        raise HTTPException(
            status_code=400,
            detail="theme_preference must be 'dark' or 'light'."
        )

    try:
        _get_profile_or_404(payload.email)

        supabase.table("profiles").update(
            {"theme_preference": payload.theme_preference}
        ).eq("email", payload.email).execute()

        return {"success": True, "theme_preference": payload.theme_preference}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------------
# Notifications
# ------------------------------------------------------------------

@router.put("/notifications")
def update_notifications(
    payload: NotificationsUpdate,
    auth_email: str = Depends(get_authenticated_email),
):
    require_self(payload.email, auth_email)
    try:
        _get_profile_or_404(payload.email)

        supabase.table("profiles").update(
            {
                "notif_email_enabled": payload.notif_email_enabled,
                "notif_job_alerts_enabled": payload.notif_job_alerts_enabled,
                "notif_weekly_summary_enabled": payload.notif_weekly_summary_enabled,
            }
        ).eq("email", payload.email).execute()

        return {"success": True}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------------
# Security & Account
# ------------------------------------------------------------------

@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    auth_email: str = Depends(get_authenticated_email),
):
    require_self(payload.email, auth_email)

    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="New password must be at least 8 characters long."
        )

    # Verifies the current password using the exact same call already
    # used by POST /auth/login - a wrong current password fails here
    # with a 401 before anything is changed.
    try:
        verification = supabase.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.current_password,
        })
    except Exception:
        raise HTTPException(status_code=401, detail="Current password is incorrect.")

    if not verification or not verification.user:
        raise HTTPException(status_code=401, detail="Current password is incorrect.")

    user_id = verification.user.id

    try:
        supabase.auth.admin.update_user_by_id(user_id, {"password": payload.new_password})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not update password: {e}")

    return {"success": True, "message": "Your password has been updated."}


@router.post("/account/delete")
def delete_account(
    payload: DeleteAccountRequest,
    auth_email: str = Depends(get_authenticated_email),
):
    """
    Requires the current password as confirmation (the same
    verification pattern as Change Password) before deleting anything.
    Deletes every row this user owns, then removes the Supabase Auth
    identity itself last, so a failure partway through data cleanup
    never leaves the person locked out with their data still gone.
    """
    require_self(payload.email, auth_email)

    try:
        verification = supabase.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password,
        })
    except Exception:
        raise HTTPException(status_code=401, detail="Incorrect password. Your account was not deleted.")

    if not verification or not verification.user:
        raise HTTPException(status_code=401, detail="Incorrect password. Your account was not deleted.")

    user_id = verification.user.id

    try:
        _delete_all_user_data(payload.email)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Could not delete account data: {e}")

    try:
        supabase.auth.admin.delete_user(user_id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                "Your account data was deleted, but we couldn't fully remove your "
                f"login. Please contact support. ({e})"
            )
        )

    return {"success": True, "message": "Your account has been permanently deleted."}