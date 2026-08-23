"""
Shared Supabase Storage helpers used by more than one route module.

delete_storage_object was originally defined only in routes/settings.py
and used there for avatars, certificates, and support attachments -
resumes were the one upload flow that never cleaned up the file being
replaced, leaving old resumes (and their still-public URLs) in storage
forever. Pulling this out to a shared module lets routes/resume.py
reuse the exact same, already-correct logic instead of duplicating or
reimplementing it.
"""

from app.database.db import supabase


def delete_storage_object(bucket: str, public_url: str | None) -> None:
    """
    Best-effort cleanup only - a failure here should never block a
    profile update, resume replacement, or account deletion that has
    already succeeded in the database. Parses the object path back out
    of the public URL Supabase Storage returns (the get_public_url()
    shape used by every upload flow in this app), since only the URL is
    persisted, not the raw storage path.
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