"""
End-to-end login tests against a local FAKE Supabase Auth server.

Unlike test_auth_routes.py (which stubs the client), these tests use the
real supabase_auth client and let it parse real-shaped HTTP responses, so
they verify the whole chain: HTTP response -> library exception -> our
classification -> the response the browser receives.

The fake server only listens on 127.0.0.1 and uses made-up data. No real
Supabase project, key or credential is involved.
"""

import json
import socket
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

import pytest
from supabase import ClientOptions, create_client

USER = {
    "id": "00000000-0000-0000-0000-000000000001",
    "aud": "authenticated",
    "role": "authenticated",
    "email": "student@example.com",
    "app_metadata": {},
    "user_metadata": {},
    "created_at": "2026-01-01T00:00:00Z",
}

SCENARIOS = {
    "success": (200, {
        "access_token": "fake-access-token", "token_type": "bearer", "expires_in": 3600,
        "refresh_token": "fake-refresh-token", "user": USER,
    }),
    "wrong_password": (400, {"code": 400, "error_code": "invalid_credentials", "msg": "Invalid login credentials"}),
    "wrong_password_legacy": (400, {"error": "invalid_grant", "error_description": "Invalid login credentials"}),
    "email_not_confirmed": (400, {"code": 400, "error_code": "email_not_confirmed", "msg": "Email not confirmed"}),
    "rate_limited": (429, {"code": 429, "error_code": "over_request_rate_limit", "msg": "Request rate limit reached"}),
    "bad_api_key": (401, {"message": "Invalid API key", "hint": "Double check your Supabase `anon` or `service_role` API key."}),
    "upstream_500": (500, {"code": 500, "error_code": "unexpected_failure", "msg": "Database error querying schema"}),
    "upstream_503": (503, "upstream connect error or disconnect/reset before headers"),
    "upstream_502": (502, "<html>Bad Gateway</html>"),
    "html_200": (200, "<html>not json</html>"),
}


class _Handler(BaseHTTPRequestHandler):
    def do_POST(self):  # noqa: N802 - http.server naming
        self.rfile.read(int(self.headers.get("Content-Length", 0)))
        status, body = SCENARIOS[self.server.scenario]
        payload = (json.dumps(body) if isinstance(body, dict) else body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json" if isinstance(body, dict) else "text/plain")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args):  # keep test output clean
        pass


@pytest.fixture()
def fake_supabase(monkeypatch):
    server = HTTPServer(("127.0.0.1", 0), _Handler)
    server.scenario = "success"
    threading.Thread(target=server.serve_forever, daemon=True).start()

    client = create_client(
        f"http://127.0.0.1:{server.server_port}",
        "test-key-not-a-real-key",
        options=ClientOptions(auto_refresh_token=False, persist_session=False),
    )
    monkeypatch.setattr("app.routes.auth.supabase_auth", client)
    yield server
    server.shutdown()
    server.server_close()


CREDS = {"email": "student@example.com", "password": "S3cret-Pass!"}


def test_success_end_to_end(client, fake_supabase):
    r = client.post("/auth/login", json=CREDS)

    assert r.status_code == 200
    assert r.json()["session"]["access_token"] == "fake-access-token"
    assert r.json()["user"]["email"] == "student@example.com"


@pytest.mark.parametrize(
    "scenario, status, fragment",
    [
        ("wrong_password", 401, "Invalid email or password"),
        ("wrong_password_legacy", 401, "Invalid email or password"),
        ("email_not_confirmed", 403, "verify your email"),
        ("rate_limited", 429, "Too many attempts"),
        ("bad_api_key", 503, "temporarily unavailable"),
        ("upstream_500", 503, "temporarily unavailable"),
        ("upstream_503", 503, "temporarily unavailable"),
        ("upstream_502", 503, "temporarily unavailable"),
        ("html_200", 503, "temporarily unavailable"),
    ],
)
def test_real_client_parsing_maps_to_the_right_response(client, fake_supabase, scenario, status, fragment):
    fake_supabase.scenario = scenario

    r = client.post("/auth/login", json=CREDS)

    assert r.status_code == status, r.text
    assert fragment in r.json()["detail"]


def test_unreachable_supabase_is_503_not_401(client, monkeypatch):
    # Reserve a port, then close it so nothing is listening on it.
    sock = socket.socket()
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()

    dead_client = create_client(
        f"http://127.0.0.1:{port}",
        "test-key-not-a-real-key",
        options=ClientOptions(auto_refresh_token=False, persist_session=False),
    )
    monkeypatch.setattr("app.routes.auth.supabase_auth", dead_client)

    r = client.post("/auth/login", json=CREDS)

    assert r.status_code == 503
    assert "temporarily unavailable" in r.json()["detail"]
