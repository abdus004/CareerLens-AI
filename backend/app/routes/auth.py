import logging

from fastapi import APIRouter, Depends, Header, HTTPException
from app.models.auth import LogoutRequest, RefreshSessionRequest, UserLogin, UserSignup
from app.database.db import create_request_auth_client, supabase_auth
from app.utils.auth_errors import (
    AuthError,
    AuthFailureKind,
    AuthUnknownError,
    SERVER_SIDE_KINDS,
    classify_auth_exception,
    classify_session_exception,
    failure_for,
    log_auth_failure,
)
from app.utils.security import get_authenticated_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization. Please log in again.")
    token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing or invalid authorization. Please log in again.")
    return token


def _signup_user_message(e: Exception, fallback: str) -> str:
    """
    Supabase's own Auth errors (AuthApiError etc. - all subclasses of
    AuthError) carry a curated, human-written message meant to be shown
    to end users ("Password should be at least N characters", ...).
    AuthUnknownError is the exception: it wraps an arbitrary unexpected
    underlying error, so its text is never trusted or shown.
    """
    if isinstance(e, AuthError) and not isinstance(e, AuthUnknownError):
        return str(e)
    return fallback


@router.post("/signup")
def signup(user: UserSignup):

    # Normalized the same way the frontend already does
    # (email.trim().toLowerCase()) so a profile row created right
    # after signup (POST /profile/) always matches this exact string -
    # Postgres text equality is case-sensitive, and profiles.email has
    # no citext/lower() index, so a mismatch here would silently break
    # every later profile/dashboard lookup for that account.
    normalized_email = str(user.email).strip().lower()

    try:
        response = supabase_auth.auth.sign_up(
            {
                "email": normalized_email,
                "password": user.password,
                "options": {
                    "data": {
                        "full_name": user.full_name
                    }
                }
            }
        )

    except Exception as e:
        error_text = str(e).lower()

        # Some project configurations (email confirmation disabled)
        # raise an explicit error for a duplicate email instead of the
        # silent "empty identities" response handled below. Catch that
        # case here with a clear, specific message instead of a raw
        # exception string.
        if "already registered" in error_text or "already exists" in error_text:
            raise HTTPException(
                status_code=409,
                detail="An account with this email already exists. Please log in instead."
            )

        failure = classify_auth_exception(e)
        log_auth_failure(logger, "signup", e, failure)

        # Service/configuration problems and rate limits get their own
        # status codes instead of being reported as a bad sign-up request.
        if failure.kind in SERVER_SIDE_KINDS or failure.kind == AuthFailureKind.RATE_LIMITED:
            raise HTTPException(status_code=failure.status_code, detail=failure.detail)

        raise HTTPException(
            status_code=400,
            detail=_signup_user_message(e, "We couldn't create your account. Please try again.")
        )

    # When email confirmation IS enabled, Supabase intentionally does
    # NOT raise an error for a duplicate, already-confirmed email - for
    # security, to avoid letting anyone probe which emails are already
    # registered. Instead it returns a "successful" response whose
    # user.identities list is empty. This is the documented way to
    # detect that case (see supabase/discussions#1282).
    identities = getattr(response.user, "identities", None) if response.user else None

    if response.user and identities is not None and len(identities) == 0:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists. Please log in instead."
        )

    # Genuinely new account. Whether a usable session comes back depends
    # on this project's email-confirmation setting, which this code
    # can't know in advance - so it's read directly off the real
    # response instead of being assumed.
    if response.session:
        return {
            "status": "signed_in",
            "message": "Your account has been created and you're now signed in.",
            "user": response.user,
            "session": response.session
        }

    return {
        "status": "confirmation_required",
        "message": "Your account has been created. Please check your email to verify your account before logging in.",
        "user": response.user,
        "session": None
    }


@router.post("/login")
def login(user: UserLogin):

    try:
        response = supabase_auth.auth.sign_in_with_password(
            {
                "email": str(user.email).strip().lower(),
                "password": user.password
            }
        )

    except Exception as e:
        # Each kind of failure gets its own status code and a fixed,
        # user-safe message (see app/utils/auth_errors.py):
        #   wrong email/password -> 401, unconfirmed email -> 403,
        #   too many attempts -> 429, Supabase down/misconfigured -> 503,
        #   anything unexpected -> 500.
        # The real reason is written to the server log, never sent to the
        # client, and the log never contains the email or password.
        failure = classify_auth_exception(e)
        log_auth_failure(logger, "login", e, failure)
        raise HTTPException(status_code=failure.status_code, detail=failure.detail)

    if not response or not response.session or not response.user:
        # Supabase reported success but returned no usable session. Report
        # it as a server problem rather than as a credentials problem.
        logger.error("login failed: Supabase returned a success response without a session or user")
        raise HTTPException(
            status_code=500,
            detail=failure_for(AuthFailureKind.UNEXPECTED).detail,
        )

    return {
        "message": "Login successful",
        "session": response.session,
        "user": response.user
    }


@router.post("/refresh")
def refresh_session(payload: RefreshSessionRequest):
    """Rotate a Supabase refresh token using an isolated per-request client."""
    try:
        client = create_request_auth_client()
        response = client.auth.refresh_session(payload.refresh_token)
    except Exception as exc:
        failure = classify_session_exception(exc)
        log_auth_failure(logger, "session refresh", exc, failure)
        raise HTTPException(status_code=failure.status_code, detail=failure.detail)

    if not response or not response.session or not response.user:
        logger.error("session refresh failed: Supabase returned no session or user")
        raise HTTPException(status_code=500, detail=failure_for(AuthFailureKind.UNEXPECTED).detail)

    return {"message": "Session refreshed", "session": response.session, "user": response.user}


@router.post("/logout")
def logout(
    payload: LogoutRequest,
    authorization: str | None = Header(default=None),
    _auth_email: str = Depends(get_authenticated_email),
):
    """Revoke only the session represented by the current bearer token."""
    access_token = _bearer_token(authorization)
    try:
        client = create_request_auth_client()
        client.auth.set_session(access_token, payload.refresh_token)
        # Supabase defaults to global logout; local is the current session only.
        client.auth.sign_out({"scope": "local"})
    except Exception as exc:
        failure = classify_session_exception(exc)
        log_auth_failure(logger, "session logout", exc, failure)
        raise HTTPException(status_code=failure.status_code, detail=failure.detail)

    return {"success": True, "message": "Signed out successfully."}
