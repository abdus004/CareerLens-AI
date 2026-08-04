import uuid
from datetime import datetime, timezone

from app.database.db import supabase

# ---------------------------------------------------------------------
# "My Certificates" (Section 1) + completing a Recommended Certification
# (Section 3 -> Section 1 hand-off). Zero Gemini calls anywhere in this
# file - this is pure upload/storage/CRUD, following the same
# Supabase Storage pattern already used by routes/resume.py.
# ---------------------------------------------------------------------

STORAGE_BUCKET = "user-certificates"


def _upload_file(file_bytes: bytes, original_filename: str, content_type: str) -> tuple[str, str]:
    ext = ""
    if original_filename and "." in original_filename:
        ext = "." + original_filename.rsplit(".", 1)[-1]

    filename = f"{uuid.uuid4()}{ext}"

    supabase.storage.from_(STORAGE_BUCKET).upload(
        path=filename,
        file=file_bytes,
        file_options={"content-type": content_type or "application/octet-stream"},
    )
    public_url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(filename)
    return public_url, (content_type or "application/octet-stream")


def list_user_certificates(email: str) -> list:
    response = (
        supabase.table("user_certificates")
        .select("*")
        .eq("email", email)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []


def add_user_certificate(
    email: str,
    certificate_name: str,
    provider: str,
    issue_date: str,
    category: str,
    file_bytes: bytes,
    original_filename: str,
    content_type: str,
) -> dict:
    file_url, resolved_content_type = _upload_file(file_bytes, original_filename, content_type)

    row = {
        "email": email,
        "certificate_name": certificate_name,
        "provider": provider,
        "issue_date": issue_date,
        "category": category or "Other",
        "file_url": file_url,
        "file_type": resolved_content_type,
        "source": "upload",
    }

    inserted = supabase.table("user_certificates").insert(row).execute()
    return inserted.data[0]


def complete_recommendation(
    recommendation_id: str,
    email: str,
    certificate_name: str,
    provider: str,
    issue_date: str,
    file_bytes: bytes,
    original_filename: str,
    content_type: str,
) -> dict:
    """
    Verifies (server-side) that this recommendation belongs to this
    email and has reached 100% progress, then uploads the certificate,
    inserts it into My Certificates, and removes the recommendation
    (its certificate_progress row cascades automatically). Raises
    ValueError for any eligibility failure - the route layer turns that
    into a 400/404 as appropriate.
    """
    recommendation_response = (
        supabase.table("certificate_recommendations")
        .select("*")
        .eq("id", recommendation_id)
        .maybe_single()
        .execute()
    )
    if not recommendation_response or not recommendation_response.data:
        raise ValueError("Recommendation not found.")

    recommendation = recommendation_response.data
    if recommendation["email"] != email:
        raise ValueError("This recommendation does not belong to this account.")

    progress_response = (
        supabase.table("certificate_progress")
        .select("progress_percent")
        .eq("recommendation_id", recommendation_id)
        .maybe_single()
        .execute()
    )
    progress_percent = (
        progress_response.data.get("progress_percent", 0)
        if progress_response and progress_response.data
        else 0
    )
    if progress_percent < 100:
        raise ValueError("Progress must reach 100% before uploading your certificate.")

    file_url, resolved_content_type = _upload_file(file_bytes, original_filename, content_type)

    row = {
        "email": email,
        "certificate_name": certificate_name or recommendation["certificate_name"],
        "provider": provider or recommendation["provider"],
        "issue_date": issue_date,
        "category": recommendation.get("category") or "Other",
        "file_url": file_url,
        "file_type": resolved_content_type,
        "source": "recommendation",
    }

    inserted = supabase.table("user_certificates").insert(row).execute()

    # Removes it from Recommended Certifications - certificate_progress
    # is deleted automatically via ON DELETE CASCADE.
    supabase.table("certificate_recommendations").delete().eq("id", recommendation_id).execute()

    return inserted.data[0]


def update_progress(recommendation_id: str, email: str, progress_percent: int) -> dict:
    recommendation_response = (
        supabase.table("certificate_recommendations")
        .select("id, email")
        .eq("id", recommendation_id)
        .maybe_single()
        .execute()
    )
    if not recommendation_response or not recommendation_response.data:
        raise ValueError("Recommendation not found.")
    if recommendation_response.data["email"] != email:
        raise ValueError("This recommendation does not belong to this account.")

    if progress_percent not in (0, 25, 50, 75, 100):
        raise ValueError("progress_percent must be one of 0, 25, 50, 75, 100.")

    updated = (
        supabase.table("certificate_progress")
        .update(
            {
                "progress_percent": progress_percent,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .eq("recommendation_id", recommendation_id)
        .execute()
    )
    return updated.data[0] if updated.data else {"recommendation_id": recommendation_id, "progress_percent": progress_percent}
