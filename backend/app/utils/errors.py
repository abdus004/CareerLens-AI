"""
Shared error-handling helper.

raise_clean_500 was originally defined only in routes/certificates.py.
Every other route file's generic exception handler did
`raise HTTPException(status_code=500, detail=str(e))` instead - which
means the RAW Python/Supabase/Postgres exception text (column names,
constraint names, occasionally query fragments) was being sent
straight to the client, since the frontend's getErrorMessage() renders
HTTPException.detail verbatim in the UI. Pulling this out to a shared
module lets every route reuse the one place that already got this
right, instead of leaving it as a one-off in certificates.py.
"""

import logging

from fastapi import HTTPException

try:
    from postgrest.exceptions import APIError
except ImportError:  # pragma: no cover - postgrest is always installed
    # here via the supabase package, but keep this import defensive so a
    # missing/renamed dependency degrades to "log everything the same
    # way" instead of breaking every route that imports this module.
    APIError = ()

logger = logging.getLogger(__name__)


def raise_clean_500(e: Exception, logger_name: str = __name__) -> None:
    """
    Never surface a raw Supabase/Postgres error (a Python dict repr
    like {'message': ..., 'code': '23514', 'hint': ..., 'details': ...})
    or any other internal exception text directly to the user. The
    real error is always logged server-side either way, so nothing is
    lost for debugging - it just isn't shown raw in the UI.

    Always raises (return type is None only because this function
    never returns normally) - callers should still write
    `raise raise_clean_500(e)`-shaped code as `raise_clean_500(e)` in a
    bare `except Exception as e:` block, same as the original
    certificates.py call sites.
    """
    route_logger = logging.getLogger(logger_name)

    if isinstance(e, APIError):
        route_logger.error("Supabase error: %s", e.json() if hasattr(e, "json") else e)
        raise HTTPException(
            status_code=500,
            detail="Something went wrong saving that. Please try again in a moment.",
        )

    route_logger.exception("Unexpected error")
    raise HTTPException(status_code=500, detail="Something went wrong. Please try again.")