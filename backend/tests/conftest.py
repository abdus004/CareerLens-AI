"""
Shared test setup.

Safety rules enforced here:
  * Tests never read the developer's real backend/.env file. db.py calls
    load_dotenv(override=True); that function is replaced with a no-op
    BEFORE the app is imported, so real SUPABASE_*/GEMINI_* values can
    never be loaded into a test run.
  * Tests never talk to the real Supabase project. The Supabase URL used
    at import time points at a closed local port, and every test that
    needs a Supabase response swaps in a stub or a local fake server.
"""

import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace

import dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

dotenv.load_dotenv = lambda *args, **kwargs: False

os.environ["SUPABASE_URL"] = "http://127.0.0.1:9"
os.environ["SUPABASE_KEY"] = "test-key-not-a-real-key"
os.environ["GEMINI_API_KEY_1"] = "test-key-not-a-real-key"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from supabase_auth.types import AuthResponse, Session, User  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture()
def client():
    # Deliberately not used as a context manager, so the app's lifespan
    # (which starts the background scheduler) is not run during tests.
    return TestClient(app)


def make_auth_response() -> AuthResponse:
    """A realistic successful sign-in/sign-up response with fake values."""
    now = datetime(2026, 1, 1, tzinfo=timezone.utc)
    user = User(
        id="00000000-0000-0000-0000-000000000001",
        aud="authenticated",
        email="student@example.com",
        app_metadata={},
        user_metadata={},
        created_at=now,
    )
    session = Session(
        access_token="fake-access-token",
        refresh_token="fake-refresh-token",
        expires_in=3600,
        token_type="bearer",
        user=user,
    )
    return AuthResponse(user=user, session=session)


class FakeAuthClient:
    """
    Stands in for the Supabase client used by routes/auth.py.

    Set `result` to the object the next call should return, or `error` to
    an exception it should raise. `calls` records every credentials/payload
    the route passed in, so tests can assert on normalisation.
    """

    def __init__(self):
        self.result = None
        self.error = None
        self.calls = []
        self.auth = SimpleNamespace(
            sign_in_with_password=self._respond,
            sign_up=self._respond,
        )

    def _respond(self, payload):
        self.calls.append(payload)
        if self.error is not None:
            raise self.error
        return self.result


@pytest.fixture()
def fake_auth(monkeypatch):
    fake = FakeAuthClient()
    monkeypatch.setattr("app.routes.auth.supabase_auth", fake)
    return fake
