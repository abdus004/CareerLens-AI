"""
Route-level tests for POST /auth/login and POST /auth/signup.

Supabase is replaced by a stub (see tests/conftest.py), so each failure
scenario can be triggered deterministically and no network is used.
"""

import logging

import httpx
import pytest

from app.utils.auth_errors import AuthApiError, AuthRetryableError, AuthUnknownError
from tests.conftest import make_auth_response

LOGIN = "/auth/login"
SIGNUP = "/auth/signup"
GOOD_LOGIN = {"email": "Student@Example.com ", "password": "S3cret-Pass!"}
GOOD_SIGNUP = {"full_name": "Test Student", "email": "new@example.com", "password": "Str0ng-Pass!"}


# --------------------------------------------------------------- login: success


def test_login_success_returns_session_and_user(client, fake_auth):
    fake_auth.result = make_auth_response()

    r = client.post(LOGIN, json=GOOD_LOGIN)

    assert r.status_code == 200
    body = r.json()
    assert body["message"] == "Login successful"
    assert body["session"]["access_token"] == "fake-access-token"
    assert body["session"]["refresh_token"] == "fake-refresh-token"
    assert body["user"]["email"] == "student@example.com"


def test_login_normalises_email_before_calling_supabase(client, fake_auth):
    fake_auth.result = make_auth_response()

    client.post(LOGIN, json=GOOD_LOGIN)

    assert fake_auth.calls == [{"email": "student@example.com", "password": "S3cret-Pass!"}]


# --------------------------------------------------- login: each failure scenario


@pytest.mark.parametrize(
    "error, status, detail_fragment",
    [
        pytest.param(
            AuthApiError("Invalid login credentials", 400, "invalid_credentials"),
            401, "Invalid email or password", id="wrong-password",
        ),
        pytest.param(
            AuthApiError("Invalid login credentials", 400, None),
            401, "Invalid email or password", id="wrong-password-legacy-gotrue",
        ),
        pytest.param(
            AuthApiError("Email not confirmed", 400, "email_not_confirmed"),
            403, "verify your email", id="email-not-confirmed",
        ),
        pytest.param(
            AuthApiError("User is banned", 400, "user_banned"),
            403, "disabled", id="account-disabled",
        ),
        pytest.param(
            AuthApiError("Request rate limit reached", 429, "over_request_rate_limit"),
            429, "Too many attempts", id="rate-limited",
        ),
        pytest.param(
            AuthApiError("Invalid API key", 401, None),
            503, "temporarily unavailable", id="backend-api-key-rejected",
        ),
        pytest.param(
            AuthApiError("Database error querying schema", 500, "unexpected_failure"),
            503, "temporarily unavailable", id="supabase-500",
        ),
        pytest.param(
            AuthRetryableError("upstream connect error", 503),
            503, "temporarily unavailable", id="supabase-503",
        ),
        pytest.param(
            AuthUnknownError("odd response", ValueError("html")),
            503, "temporarily unavailable", id="unparseable-upstream-response",
        ),
        pytest.param(
            httpx.ConnectError("connection refused"),
            503, "temporarily unavailable", id="supabase-unreachable",
        ),
        pytest.param(
            httpx.ReadTimeout("timed out"),
            503, "temporarily unavailable", id="supabase-timeout",
        ),
        pytest.param(
            RuntimeError("unexpected bug"),
            500, "Something went wrong", id="unexpected-exception",
        ),
    ],
)
def test_login_failure_scenarios(client, fake_auth, error, status, detail_fragment):
    fake_auth.error = error

    r = client.post(LOGIN, json=GOOD_LOGIN)

    assert r.status_code == status
    assert detail_fragment in r.json()["detail"]


def test_not_every_failure_is_a_401(client, fake_auth):
    """The core regression: different failures must produce different statuses."""
    seen = set()
    for error in (
        AuthApiError("Invalid login credentials", 400, "invalid_credentials"),
        AuthApiError("Email not confirmed", 400, "email_not_confirmed"),
        AuthApiError("Request rate limit reached", 429, "over_request_rate_limit"),
        httpx.ConnectError("refused"),
        RuntimeError("bug"),
    ):
        fake_auth.error = error
        seen.add(client.post(LOGIN, json=GOOD_LOGIN).status_code)

    assert seen == {401, 403, 429, 503, 500}


def test_login_success_without_a_session_is_a_server_error_not_a_401(client, fake_auth):
    response = make_auth_response()
    response.session = None
    fake_auth.result = response

    r = client.post(LOGIN, json=GOOD_LOGIN)

    assert r.status_code == 500


def test_login_rejects_malformed_email_without_calling_supabase(client, fake_auth):
    r = client.post(LOGIN, json={"email": "not-an-email", "password": "x"})

    assert r.status_code == 422
    assert fake_auth.calls == []


def test_login_with_empty_password_is_a_bad_request(client, fake_auth):
    from app.utils.auth_errors import AuthInvalidCredentialsError

    fake_auth.error = AuthInvalidCredentialsError(
        "You must provide either an email or phone number and a password"
    )

    r = client.post(LOGIN, json={"email": "a@example.com", "password": ""})

    assert r.status_code == 400


# ------------------------------------------------------------- login: logging


SENSITIVE = "SENSITIVE-DETAIL-DB-PASSWORD-123"


def test_responses_never_leak_the_raw_error_text(client, fake_auth):
    for error in (
        AuthApiError(SENSITIVE, 500, "unexpected_failure"),
        AuthApiError(SENSITIVE, 401, None),
        httpx.ConnectError(SENSITIVE),
        RuntimeError(SENSITIVE),
    ):
        fake_auth.error = error
        r = client.post(LOGIN, json=GOOD_LOGIN)
        assert SENSITIVE not in r.text


def test_server_side_failures_are_logged_at_error_with_traceback(client, fake_auth, caplog):
    fake_auth.error = httpx.ConnectError("connection refused")

    with caplog.at_level(logging.INFO, logger="app.routes.auth"):
        client.post(LOGIN, json=GOOD_LOGIN)

    records = [r for r in caplog.records if r.name == "app.routes.auth"]
    assert len(records) == 1
    assert records[0].levelno == logging.ERROR
    assert records[0].exc_info is not None
    assert "kind=service_unavailable" in records[0].getMessage()
    assert "ConnectError" in records[0].getMessage()


def test_user_mistakes_are_logged_as_warnings_without_traceback(client, fake_auth, caplog):
    fake_auth.error = AuthApiError("Invalid login credentials", 400, "invalid_credentials")

    with caplog.at_level(logging.INFO, logger="app.routes.auth"):
        client.post(LOGIN, json=GOOD_LOGIN)

    records = [r for r in caplog.records if r.name == "app.routes.auth"]
    assert len(records) == 1
    assert records[0].levelno == logging.WARNING
    assert records[0].exc_info is None
    assert "kind=invalid_credentials" in records[0].getMessage()
    assert "supabase_code=invalid_credentials" in records[0].getMessage()


def test_logs_never_contain_the_email_or_password(client, fake_auth, caplog):
    errors = (
        AuthApiError("Invalid login credentials", 400, "invalid_credentials"),
        AuthApiError("Invalid API key", 401, None),
        httpx.ConnectError("refused"),
        RuntimeError("bug"),
    )
    with caplog.at_level(logging.DEBUG):
        for error in errors:
            fake_auth.error = error
            client.post(LOGIN, json=GOOD_LOGIN)

    assert "S3cret-Pass!" not in caplog.text
    assert "student@example.com" not in caplog.text.lower()


# ---------------------------------------------------------------------- signup


def test_signup_success_still_works(client, fake_auth):
    fake_auth.result = make_auth_response()

    r = client.post(SIGNUP, json=GOOD_SIGNUP)

    assert r.status_code == 200
    assert r.json()["status"] == "signed_in"


def test_signup_duplicate_email_is_still_409(client, fake_auth):
    fake_auth.error = AuthApiError("User already registered", 422, "user_already_exists")

    r = client.post(SIGNUP, json=GOOD_SIGNUP)

    assert r.status_code == 409


def test_signup_shows_supabase_user_facing_message_for_bad_requests(client, fake_auth):
    fake_auth.error = AuthApiError("Password is known to be weak", 422, "weak_password")

    r = client.post(SIGNUP, json=GOOD_SIGNUP)

    assert r.status_code == 400
    assert r.json()["detail"] == "Password is known to be weak"


def test_signup_reports_service_failures_as_503_not_400(client, fake_auth):
    fake_auth.error = httpx.ConnectError("refused")

    r = client.post(SIGNUP, json=GOOD_SIGNUP)

    assert r.status_code == 503
    assert "refused" not in r.text


def test_signup_does_not_show_raw_text_of_unexpected_upstream_errors(client, fake_auth):
    fake_auth.error = AuthUnknownError(SENSITIVE, ValueError(SENSITIVE))

    r = client.post(SIGNUP, json=GOOD_SIGNUP)

    assert r.status_code == 503
    assert SENSITIVE not in r.text
