"""
Session-based authorization for profile/account endpoints.

Previously nothing in this backend ever verified that the `email` a
request claimed to act as was the email actually logged in - every
profile/settings route just trusted whatever the client sent. Since
the frontend already stores a real Supabase session (see
utils/session.js -> saveSession, which persists the access_token
Supabase Auth issued at login/signup) and services/api.js now attaches
it as `Authorization: Bearer <access_token>` on every request, this
module gives routes a cheap way to find out who is ACTUALLY logged in
and refuse to act on someone else's data.

Deliberately does not invent a second auth system: it just asks
Supabase Auth (the same client already used everywhere else in this
backend) to validate the token it issued.
"""

from fastapi import Header, HTTPException

from app.database.db import supabase


def get_authenticated_email(authorization: str | None = Header(default=None)) -> str:
    """
    FastAPI dependency. Extracts the bearer token, asks Supabase Auth
    to validate it, and returns the verified email - or raises 401.

    Usage:
        @router.get("/{email}")
        def get_profile(email: str, auth_email: str = Depends(get_authenticated_email)):
            require_self(email, auth_email)
            ...
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid authorization. Please log in again.",
        )

    token = authorization[7:].strip()
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid authorization. Please log in again.",
        )

    try:
        result = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Your session has expired. Please log in again.",
        )

    user = getattr(result, "user", None)
    email = getattr(user, "email", None) if user else None

    if not email:
        raise HTTPException(
            status_code=401,
            detail="Your session has expired. Please log in again.",
        )

    return email.strip().lower()


def require_self(target_email: str, authenticated_email: str) -> None:
    """
    Raises 403 unless the email a route was asked to read/modify
    matches the email actually logged in. Case-insensitive since email
    storage/comparison elsewhere in this app is not consistently
    lower-cased.
    """
    if not target_email or target_email.strip().lower() != authenticated_email.strip().lower():
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to access or modify this profile.",
        )
