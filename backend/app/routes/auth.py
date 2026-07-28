from fastapi import APIRouter, HTTPException
from app.models.auth import UserSignup, UserLogin
from app.database.db import supabase

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup")
def signup(user: UserSignup):

    try:
        response = supabase.auth.sign_up(
            {
                "email": user.email,
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

        raise HTTPException(status_code=400, detail=str(e))

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

        response = supabase.auth.sign_in_with_password(
            {
                "email": user.email,
                "password": user.password
            }
        )

        return {
            "message": "Login successful",
            "session": response.session,
            "user": response.user
        }

    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))