import re
import uuid
from datetime import datetime, timezone
from typing import Optional

from app.database.db import supabase

# ---------------------------------------------------------------------
# "My Certificates" (Section 1) + completing a Recommended Certification
# (Section 3 -> Section 1 hand-off). Zero Gemini calls anywhere in this
# file - this is pure upload/storage/CRUD, following the same
# Supabase Storage pattern already used by routes/resume.py.
# ---------------------------------------------------------------------

STORAGE_BUCKET = "user-certificates"


def _derive_name_from_filename(original_filename: str) -> str:
    """
    Turns an uploaded filename into a readable certificate name when
    the user leaves Certificate Name blank, e.g.
    'AWS_Cloud_Practitioner.pdf' -> 'AWS Cloud Practitioner'.
    Preserves existing all-caps acronyms (AWS, IBM, SQL, ...) instead
    of lowercasing them.
    """
    if not original_filename:
        return "Untitled Certificate"

    base = original_filename.rsplit(".", 1)[0] if "." in original_filename else original_filename
    base = re.sub(r"[_\-]+", " ", base).strip()
    base = re.sub(r"\s+", " ", base)

    if not base:
        return "Untitled Certificate"

    words = []
    for word in base.split(" "):
        if word.isupper() and len(word) > 1:
            words.append(word)
        else:
            words.append(word[:1].upper() + word[1:] if word else word)

    return " ".join(words)


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
    certificate_name: Optional[str],
    provider: Optional[str],
    issue_date: Optional[str],
    category: Optional[str],
    file_bytes: bytes,
    original_filename: str,
    content_type: str,
    career_relevant: bool = False,
    relevance_note: Optional[str] = None,
) -> dict:
    """
    Certificate File is the only truly required input here.
    certificate_name / provider / issue_date / category may all arrive
    as None or as an empty/blank string (both are treated the same
    way) and each falls back to a sensible default before the row is
    ever built, so Supabase never sees a null it would reject:

      certificate_name -> derived from the uploaded filename
      provider          -> "Not specified"
      category          -> "Other"
      issue_date        -> stored as NULL (column allows it - see
                             alter_user_certificates_optional_fields.sql)

    career_relevant / relevance_note are computed by
    certificate_ai_service.assess_certificate_relevance in the route
    layer (this file makes zero Gemini calls, per its own docstring
    above) and simply persisted here - see user_certificates schema,
    which already has both columns for exactly this purpose.
    """
    file_url, resolved_content_type = _upload_file(file_bytes, original_filename, content_type)

    resolved_name = (certificate_name or "").strip() or _derive_name_from_filename(original_filename)
    resolved_provider = (provider or "").strip() or "Not specified"
    resolved_category = (category or "").strip() or "Other"
    resolved_issue_date = (issue_date or "").strip() or None

    row = {
        "email": email,
        "certificate_name": resolved_name,
        "provider": resolved_provider,
        "issue_date": resolved_issue_date,
        "category": resolved_category,
        "file_url": file_url,
        "file_type": resolved_content_type,
        "source": "upload",
        "career_relevant": bool(career_relevant),
        "relevance_note": relevance_note or None,
    }

    inserted = supabase.table("user_certificates").insert(row).execute()
    return inserted.data[0]


def delete_user_certificate(certificate_id: str, email: str) -> None:
    """
    Deletes one My Certificates row (and best-effort cleans up its file
    from Supabase Storage). Verifies ownership server-side first - a
    user can never delete another account's certificate just by
    knowing its id. Never touches the 'certificates' table (CareerLens
    certificates), which has no delete path at all.
    """
    existing = (
        supabase.table("user_certificates")
        .select("id, email, file_url")
        .eq("id", certificate_id)
        .maybe_single()
        .execute()
    )
    if not existing or not existing.data:
        raise ValueError("Certificate not found.")

    if existing.data["email"] != email:
        raise ValueError("This certificate does not belong to this account.")

    supabase.table("user_certificates").delete().eq("id", certificate_id).execute()

    file_url = existing.data.get("file_url")
    if file_url:
        try:
            storage_filename = file_url.rsplit("/", 1)[-1]
            supabase.storage.from_(STORAGE_BUCKET).remove([storage_filename])
        except Exception:
            # Storage cleanup is best-effort - the database record is
            # already gone, which is what the user actually sees.
            pass


def complete_recommendation(
    recommendation_id: str,
    email: str,
    certificate_name: str,
    provider: str,
    issue_date: str,
    file_bytes: bytes,
    original_filename: str,
    content_type: str,
    career_relevant: bool = False,
    relevance_note: Optional[str] = None,
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
        "career_relevant": bool(career_relevant),
        "relevance_note": relevance_note or None,
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

    # Any whole value 0-100 is allowed - see
    # backend/migrations/2026_08_08_learning_path_and_jobs_and_certs.sql,
    # which relaxes certificate_progress's CHECK constraint from the
    # fixed {0,25,50,75,100} set to a plain 0-100 range.
    if not isinstance(progress_percent, int) or progress_percent < 0 or progress_percent > 100:
        raise ValueError("progress_percent must be a whole number between 0 and 100.")

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
