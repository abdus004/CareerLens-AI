"""
Classifies failures from Supabase Auth calls (sign-in, sign-up, password
verification) into distinct, user-safe HTTP responses.

Why this exists
---------------
routes/auth.py used to import its error classes from ``gotrue.errors``.
supabase-py renamed that package to ``supabase_auth``, so on the pinned
``supabase`` version the import failed and a silent ``except ImportError``
replaced the classes with ``()``. After that, ``isinstance(e, AuthError)``
was always False, so every failure - wrong password, unconfirmed email,
a rejected API key, Supabase being down - was reported to the user as the
same "We couldn't log you in" message with HTTP 401.

This module fixes that in two ways:

1. The classes are imported from the package that actually ships them, and
   a missing package is a loud ImportError at startup, never a silent
   fallback.
2. Each failure kind maps to its own status code and message, so a
   credential problem (401), an unconfirmed email (403), a rate limit
   (429) and a service problem (503) can never be confused with each
   other.

What is sent to the client is always one of the fixed messages below, never
the raw exception text. The detailed information (exception type, Supabase
error code, HTTP status, traceback for service failures) goes to the server
log only, and never includes the email address or password.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from enum import Enum

import httpx
from pydantic import ValidationError

try:
    # supabase-py >= 2.16 ships its auth client as `supabase_auth`.
    import supabase_auth.errors as _auth_errors
except ImportError:  # pragma: no cover - only for older supabase-py releases
    # Older releases shipped the same classes as `gotrue`. If neither
    # package is installed this raises ImportError and the app refuses to
    # start, which is intentional: failing loudly beats misreporting every
    # login failure.
    import gotrue.errors as _auth_errors


class _NeverRaised(Exception):
    """Placeholder for an optional class this auth library version lacks."""


AuthError = _auth_errors.AuthError
AuthApiError = _auth_errors.AuthApiError
AuthUnknownError = _auth_errors.AuthUnknownError
AuthInvalidCredentialsError = getattr(_auth_errors, "AuthInvalidCredentialsError", _NeverRaised)
AuthRetryableError = getattr(
    _auth_errors,
    "AuthRetryableError",
    getattr(_auth_errors, "AuthRetryableFetchError", _NeverRaised),
)


class AuthFailureKind(str, Enum):
    INVALID_CREDENTIALS = "invalid_credentials"
    EMAIL_NOT_CONFIRMED = "email_not_confirmed"
    ACCOUNT_DISABLED = "account_disabled"
    RATE_LIMITED = "rate_limited"
    BAD_REQUEST = "bad_request"
    SERVICE_UNAVAILABLE = "service_unavailable"
    SERVICE_MISCONFIGURED = "service_misconfigured"
    UNEXPECTED = "unexpected"


@dataclass(frozen=True)
class AuthFailure:
    kind: AuthFailureKind
    status_code: int
    detail: str  # the only text that may be sent to the client


_SERVICE_DOWN_MESSAGE = (
    "Our sign-in service is temporarily unavailable. Please try again in a few minutes."
)

_FAILURES = {
    AuthFailureKind.INVALID_CREDENTIALS: AuthFailure(
        AuthFailureKind.INVALID_CREDENTIALS, 401, "Invalid email or password."
    ),
    AuthFailureKind.EMAIL_NOT_CONFIRMED: AuthFailure(
        AuthFailureKind.EMAIL_NOT_CONFIRMED,
        403,
        "Please verify your email address before logging in. Check your inbox for the confirmation link.",
    ),
    AuthFailureKind.ACCOUNT_DISABLED: AuthFailure(
        AuthFailureKind.ACCOUNT_DISABLED,
        403,
        "This account has been disabled. Please contact support.",
    ),
    AuthFailureKind.RATE_LIMITED: AuthFailure(
        AuthFailureKind.RATE_LIMITED,
        429,
        "Too many attempts. Please wait a moment and try again.",
    ),
    AuthFailureKind.BAD_REQUEST: AuthFailure(
        AuthFailureKind.BAD_REQUEST,
        400,
        "We couldn't process that request. Please check your details and try again.",
    ),
    AuthFailureKind.SERVICE_UNAVAILABLE: AuthFailure(
        AuthFailureKind.SERVICE_UNAVAILABLE, 503, _SERVICE_DOWN_MESSAGE
    ),
    # Same user-facing text as "unavailable": the user can't fix a bad
    # server-side API key, and the detail must not be revealed to them.
    AuthFailureKind.SERVICE_MISCONFIGURED: AuthFailure(
        AuthFailureKind.SERVICE_MISCONFIGURED, 503, _SERVICE_DOWN_MESSAGE
    ),
    AuthFailureKind.UNEXPECTED: AuthFailure(
        AuthFailureKind.UNEXPECTED,
        500,
        "Something went wrong. Please try again.",
    ),
}

# Failures that point at the server or its configuration rather than at the
# person who made the request. These are logged at ERROR with a traceback.
SERVER_SIDE_KINDS = frozenset(
    {
        AuthFailureKind.SERVICE_UNAVAILABLE,
        AuthFailureKind.SERVICE_MISCONFIGURED,
        AuthFailureKind.UNEXPECTED,
    }
)

_RATE_LIMIT_CODES = frozenset(
    {"over_request_rate_limit", "over_email_send_rate_limit", "over_sms_send_rate_limit"}
)


def failure_for(kind: AuthFailureKind) -> AuthFailure:
    return _FAILURES[kind]


def classify_auth_exception(exc: BaseException) -> AuthFailure:
    """Map any exception raised by a Supabase Auth call to an AuthFailure."""

    # Network-level problems (DNS, connection refused, timeouts, TLS...).
    # supabase_auth lets these propagate as raw httpx errors.
    if isinstance(exc, httpx.TransportError):
        return _FAILURES[AuthFailureKind.SERVICE_UNAVAILABLE]

    # 502/503/504-style responses that supabase_auth marks as retryable.
    if isinstance(exc, AuthRetryableError):
        return _FAILURES[AuthFailureKind.SERVICE_UNAVAILABLE]

    # supabase_auth could not make sense of the upstream response (for
    # example an HTML error page from a proxy).
    if isinstance(exc, AuthUnknownError):
        return _FAILURES[AuthFailureKind.SERVICE_UNAVAILABLE]

    # The upstream answered 200 but the body wasn't the JSON an auth server
    # sends (an HTML page, for example). supabase_auth lets the parsing
    # error escape as a pydantic/JSON error. The usual cause is SUPABASE_URL
    # pointing at the wrong host, so it is logged as a configuration problem.
    if isinstance(exc, (ValidationError, json.JSONDecodeError)):
        return _FAILURES[AuthFailureKind.SERVICE_MISCONFIGURED]

    # Raised client-side when email or password is missing/empty.
    if isinstance(exc, AuthInvalidCredentialsError):
        return _FAILURES[AuthFailureKind.BAD_REQUEST]

    if isinstance(exc, AuthError):
        code = getattr(exc, "code", None)
        status = getattr(exc, "status", None)
        message = str(getattr(exc, "message", "") or exc).lower()

        if code == "email_not_confirmed" or "email not confirmed" in message:
            return _FAILURES[AuthFailureKind.EMAIL_NOT_CONFIRMED]

        if code == "user_banned":
            return _FAILURES[AuthFailureKind.ACCOUNT_DISABLED]

        if code in _RATE_LIMIT_CODES or status == 429:
            return _FAILURES[AuthFailureKind.RATE_LIMITED]

        # Older GoTrue versions return no error code, only the message.
        if code == "invalid_credentials" or "invalid login credentials" in message:
            return _FAILURES[AuthFailureKind.INVALID_CREDENTIALS]

        # GoTrue itself reports bad credentials as HTTP 400. A 401/403 that
        # reaches here comes from the API gateway rejecting the backend's own
        # SUPABASE_KEY ("Invalid API key"). That is a deployment problem, not
        # something the user did wrong.
        if status in (401, 403):
            return _FAILURES[AuthFailureKind.SERVICE_MISCONFIGURED]

        if isinstance(status, int) and status >= 500:
            return _FAILURES[AuthFailureKind.SERVICE_UNAVAILABLE]

        return _FAILURES[AuthFailureKind.BAD_REQUEST]

    return _FAILURES[AuthFailureKind.UNEXPECTED]


def log_auth_failure(
    log: logging.Logger, operation: str, exc: BaseException, failure: AuthFailure
) -> None:
    """
    Record why an auth call failed, without personal data.

    Logs the operation name, failure kind, exception type, and Supabase's
    own error code/status. It never logs the email, the password, or any
    token. Server-side failures include the traceback; ordinary user
    mistakes (wrong password, unconfirmed email) are logged briefly so a
    burst of them doesn't flood the logs with stack traces.
    """
    summary = "%s failed: kind=%s exception=%s supabase_code=%s supabase_status=%s"
    args = (
        operation,
        failure.kind.value,
        type(exc).__name__,
        getattr(exc, "code", None),
        getattr(exc, "status", None),
    )

    if failure.kind in SERVER_SIDE_KINDS:
        log.error(summary, *args, exc_info=exc)
    else:
        log.warning(summary, *args)
