"""Isolated tests for refresh, local logout, and session error handling."""

from types import SimpleNamespace

import httpx
import pytest
from fastapi import HTTPException

from app.utils.auth_errors import AuthApiError, AuthFailureKind, classify_session_exception
from app.utils.security import get_authenticated_email
from tests.conftest import make_auth_response


REFRESH = "/auth/refresh"
LOGOUT = "/auth/logout"
REFRESH_TOKEN = "fake-refresh-token"
ACCESS_TOKEN = "fake-access-token"


class FakeRequestAuth:
    def __init__(self, result=None, error=None):
        self.result = result
        self.error = error
        self.refresh_calls = []
        self.set_session_calls = []
        self.sign_out_calls = []
        self.auth = SimpleNamespace(
            refresh_session=self.refresh_session,
            set_session=self.set_session,
            sign_out=self.sign_out,
        )

    def refresh_session(self, refresh_token):
        self.refresh_calls.append(refresh_token)
        if self.error:
            raise self.error
        return self.result

    def set_session(self, access_token, refresh_token):
        self.set_session_calls.append((access_token, refresh_token))
        if self.error:
            raise self.error
        return self.result

    def sign_out(self, options):
        self.sign_out_calls.append(options)
        if self.error:
            raise self.error


@pytest.fixture()
def request_auth(monkeypatch):
    fake = FakeRequestAuth(result=make_auth_response())
    monkeypatch.setattr("app.routes.auth.create_request_auth_client", lambda: SimpleNamespace(auth=fake.auth))
    return fake


@pytest.fixture()
def authenticated_user(monkeypatch):
    fake_supabase = SimpleNamespace(
        auth=SimpleNamespace(
            get_user=lambda _token: SimpleNamespace(user=SimpleNamespace(email="student@example.com"))
        )
    )
    monkeypatch.setattr("app.utils.security.supabase", fake_supabase)


def test_refresh_rotates_and_returns_the_new_session(client, request_auth):
    response = client.post(REFRESH, json={"refresh_token": REFRESH_TOKEN})

    assert response.status_code == 200
    assert request_auth.refresh_calls == [REFRESH_TOKEN]
    assert response.json()["session"]["access_token"] == "fake-access-token"
    assert response.json()["session"]["refresh_token"] == "fake-refresh-token"


@pytest.mark.parametrize(
    "error, status",
    [
        (AuthApiError("Invalid refresh token", 400, "refresh_token_not_found"), 401),
        (AuthApiError("too many requests", 429, "over_request_rate_limit"), 429),
        (httpx.ConnectError("offline"), 503),
    ],
)
def test_refresh_classifies_failures_without_leaking_tokens(client, request_auth, error, status):
    request_auth.error = error

    response = client.post(REFRESH, json={"refresh_token": REFRESH_TOKEN})

    assert response.status_code == status
    assert REFRESH_TOKEN not in response.text


def test_refresh_requires_a_nonempty_token(client):
    assert client.post(REFRESH, json={"refresh_token": ""}).status_code == 422


def test_logout_revokes_only_the_current_session(client, request_auth, authenticated_user):
    response = client.post(
        LOGOUT,
        json={"refresh_token": REFRESH_TOKEN},
        headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
    )

    assert response.status_code == 200
    assert request_auth.set_session_calls == [(ACCESS_TOKEN, REFRESH_TOKEN)]
    assert request_auth.sign_out_calls == [{"scope": "local"}]
    assert response.json() == {"success": True, "message": "Signed out successfully."}


def test_logout_requires_an_authenticated_bearer_token(client, request_auth):
    response = client.post(LOGOUT, json={"refresh_token": REFRESH_TOKEN})

    assert response.status_code == 401
    assert request_auth.set_session_calls == []


@pytest.mark.parametrize(
    "error, kind, status",
    [
        (AuthApiError("JWT expired", 401, "jwt_expired"), AuthFailureKind.SESSION_EXPIRED, 401),
        (AuthApiError("not allowed", 403, "not_admin"), AuthFailureKind.AUTHORIZATION_DENIED, 403),
        (AuthApiError("slow down", 429, "over_request_rate_limit"), AuthFailureKind.RATE_LIMITED, 429),
        (httpx.ConnectError("offline"), AuthFailureKind.SERVICE_UNAVAILABLE, 503),
    ],
)
def test_session_validation_error_classification(error, kind, status):
    failure = classify_session_exception(error)

    assert failure.kind == kind
    assert failure.status_code == status


@pytest.mark.parametrize(
    "error, status",
    [
        (AuthApiError("JWT expired", 401, "jwt_expired"), 401),
        (AuthApiError("slow down", 429, "over_request_rate_limit"), 429),
        (httpx.ConnectError("offline"), 503),
    ],
)
def test_token_dependency_preserves_session_and_service_error_statuses(monkeypatch, error, status):
    fake_supabase = SimpleNamespace(
        auth=SimpleNamespace(get_user=lambda _token: (_ for _ in ()).throw(error))
    )
    monkeypatch.setattr("app.utils.security.supabase", fake_supabase)

    with pytest.raises(HTTPException) as raised:
        get_authenticated_email("Bearer fake-access-token")

    assert raised.value.status_code == status
    assert "fake-access-token" not in raised.value.detail
