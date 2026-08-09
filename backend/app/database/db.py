import os
from dotenv import load_dotenv
import httpx
from supabase import create_client, Client

# Load environment variables. override=True is intentional and load-
# bearing here, not a stylistic default: python-dotenv's own default
# is override=False, meaning if SUPABASE_KEY (or SUPABASE_URL) was
# EVER set as a real OS/Windows environment variable - a leftover
# `setx`, a stale System/User env var, an IDE-injected value - that
# stale value would silently win over whatever is actually in this
# .env file, with no error or warning. That's a real, observed failure
# mode on this project: a stale key can still decode as claiming
# "service_role" (the JWT payload doesn't change) while its signature
# is invalid (e.g. after the Supabase project's JWT secret was
# rotated), which PostgREST then rejects and falls back to
# unauthenticated access - surfacing later as a confusing RLS
# violation on a write, not as an auth error up front. override=True
# guarantees this .env file is always the source of truth.
load_dotenv(override=True)

# ---------------------------------------------------------------------
# Force HTTP/1.1 for every httpx.Client this process creates.
#
# postgrest-py hardcodes http2=True on its internal client with no
# setting exposed to turn it off. HTTP/2's header-compression state
# (hpack's dynamic table) is NOT thread-safe, and this app shares ONE
# global `supabase` client (this module-level singleton, imported
# everywhere via `from app.database.db import supabase`) across
# multiple threads at once: FastAPI's request threadpool, APScheduler's
# own job thread (scheduler.py), and FastAPI's BackgroundTasks. If two
# of those fire a Supabase call at the same moment, they can corrupt
# each other's shared per-connection HTTP/2 header table, producing:
#
#   RuntimeError: deque mutated during iteration
#
# (raised from inside hpack/h2, not from any code in this project).
# HTTP/1.1 doesn't share that per-connection multiplexing state the
# same way, so forcing it here eliminates the race rather than trying
# to serialize every Supabase call by hand. Must run BEFORE
# create_client() below constructs the actual client instances -
# patching httpx.Client.__init__ works regardless of import order
# since Python looks up the method on the class at call time, not at
# import time.
# ---------------------------------------------------------------------
_original_httpx_client_init = httpx.Client.__init__
_original_httpx_async_client_init = httpx.AsyncClient.__init__


def _patched_httpx_client_init(self, *args, **kwargs):
    kwargs["http2"] = False
    _original_httpx_client_init(self, *args, **kwargs)


def _patched_httpx_async_client_init(self, *args, **kwargs):
    kwargs["http2"] = False
    _original_httpx_async_client_init(self, *args, **kwargs)


httpx.Client.__init__ = _patched_httpx_client_init
httpx.AsyncClient.__init__ = _patched_httpx_async_client_init

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Validate environment variables
if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL is missing in .env")

if not SUPABASE_KEY:
    raise ValueError("SUPABASE_KEY is missing in .env")

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

import logging

logger = logging.getLogger(__name__)

logger.info("Supabase client initialized successfully.")