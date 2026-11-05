"""Unit tests for app/utils/auth_errors.py (the Supabase failure classifier)."""

import json

import httpx
import pytest
from pydantic import BaseModel, ValidationError

from app.utils import auth_errors
from app.utils.auth_errors import (
    AuthApiError,
    AuthFailureKind as Kind,
    AuthInvalidCredentialsError,
    AuthRetryableError,
    AuthUnknownError,
    classify_auth_exception,
)


def test_error_classes_come_from_the_installed_auth_package():
    """
    Regression test for the original bug: routes/auth.py imported from the
    non-existent `gotrue` package and silently fell back to `()`, so every
    failure looked identical. The classes must be real exception classes.
    """
    for cls in (auth_errors.AuthError, AuthApiError, AuthUnknownError, AuthRetryableError):
        assert isinstance(cls, type) and issubclass(cls, Exception)
    assert auth_errors.AuthError.__module__.startswith(("supabase_auth", "gotrue"))
    assert issubclass(AuthApiError, auth_errors.AuthError)


def _pydantic_parse_error():
    class _M(BaseModel):
        x: int

    try:
        _M.model_validate_json(b"<html>not json</html>")
    except ValidationError as e:
        return e


@pytest.mark.parametrize(
    "exc, kind, status",
    [
        # Wrong email/password, current GoTrue (has an error code)
        (AuthApiError("Invalid login credentials", 400, "invalid_credentials"), Kind.INVALID_CREDENTIALS, 401),
        # Wrong email/password, older GoTrue (message only, no code)
        (AuthApiError("Invalid login credentials", 400, None), Kind.INVALID_CREDENTIALS, 401),
        # Registered but never confirmed the email
        (AuthApiError("Email not confirmed", 400, "email_not_confirmed"), Kind.EMAIL_NOT_CONFIRMED, 403),
        (AuthApiError("Email not confirmed", 400, None), Kind.EMAIL_NOT_CONFIRMED, 403),
        # Disabled account
        (AuthApiError("User is banned", 400, "user_banned"), Kind.ACCOUNT_DISABLED, 403),
        # Rate limits
        (AuthApiError("Request rate limit reached", 429, "over_request_rate_limit"), Kind.RATE_LIMITED, 429),
        (AuthApiError("Email rate limit exceeded", 429, "over_email_send_rate_limit"), Kind.RATE_LIMITED, 429),
        (AuthApiError("slow down", 429, None), Kind.RATE_LIMITED, 429),
        # API gateway rejecting the backend's own key: a deployment problem
        (AuthApiError("Invalid API key", 401, None), Kind.SERVICE_MISCONFIGURED, 503),
        (AuthApiError("No API key found in request", 401, None), Kind.SERVICE_MISCONFIGURED, 503),
        # Supabase itself failing
        (AuthApiError("Database error querying schema", 500, "unexpected_failure"), Kind.SERVICE_UNAVAILABLE, 503),
        (AuthRetryableError("upstream connect error", 503), Kind.SERVICE_UNAVAILABLE, 503),
        (AuthUnknownError("bad upstream response", ValueError("html page")), Kind.SERVICE_UNAVAILABLE, 503),
        # Network-level failures raised by httpx
        (httpx.ConnectError("connection refused"), Kind.SERVICE_UNAVAILABLE, 503),
        (httpx.ReadTimeout("timed out"), Kind.SERVICE_UNAVAILABLE, 503),
        (httpx.ConnectTimeout("timed out"), Kind.SERVICE_UNAVAILABLE, 503),
        # A 200 response whose body is not JSON (e.g. SUPABASE_URL points at the wrong site)
        (_pydantic_parse_error(), Kind.SERVICE_MISCONFIGURED, 503),
        (json.JSONDecodeError("Expecting value", "<html>", 0), Kind.SERVICE_MISCONFIGURED, 503),
        # Missing email/password (raised client-side by the auth library)
        (AuthInvalidCredentialsError("You must provide either an email or phone number and a password"), Kind.BAD_REQUEST, 400),
        # Other client errors we don't recognise
        (AuthApiError("Something about the request", 422, "validation_failed"), Kind.BAD_REQUEST, 400),
        # Anything else is a bug in our code, not a credentials problem
        (RuntimeError("boom"), Kind.UNEXPECTED, 500),
        (KeyError("session"), Kind.UNEXPECTED, 500),
    ],
)
def test_classification(exc, kind, status):
    failure = classify_auth_exception(exc)
    assert failure.kind == kind
    assert failure.status_code == status


def test_only_credential_failures_map_to_401():
    """A failure that is not about credentials must never be reported as 401."""
    non_credential = [
        AuthApiError("Email not confirmed", 400, "email_not_confirmed"),
        AuthApiError("Invalid API key", 401, None),
        AuthApiError("Database error", 500, "unexpected_failure"),
        AuthRetryableError("upstream", 502),
        httpx.ConnectError("refused"),
        RuntimeError("boom"),
    ]
    assert all(classify_auth_exception(e).status_code != 401 for e in non_credential)


def test_client_messages_never_contain_raw_exception_text():
    secret_text = "internal-host.example:5432 password=hunter2 SELECT * FROM users"
    for exc in (
        AuthApiError(secret_text, 500, "unexpected_failure"),
        AuthApiError(secret_text, 401, None),
        AuthRetryableError(secret_text, 503),
        httpx.ConnectError(secret_text),
        RuntimeError(secret_text),
    ):
        failure = classify_auth_exception(exc)
        assert "hunter2" not in failure.detail
        assert "SELECT" not in failure.detail
        assert "internal-host" not in failure.detail
