import json
import threading
from typing import Optional
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from app.database.db import supabase
from app.services.placement_drive_service import sync_all_sources
from app.services.drive_matching_service import rank_recommended_drives
from app.utils.security import get_authenticated_email, require_self
from app.utils.errors import raise_clean_500

router = APIRouter(
    prefix="/placement-drives",
    tags=["Placement Drives"]
)

# This app has no per-IP/per-user request-rate-limiting middleware
# anywhere, and /refresh below is the one route that fires real
# outbound calls to external services (Greenhouse/Lever) on every hit
# with no cost cap - previously "must be a logged-in user" was the
# ONLY guard, so any authenticated user could trigger unlimited syncs
# back-to-back. In-memory + a lock is enough for this project's actual
# deployment (a single Render web service instance) and is explicitly
# a stopgap, same as the real fix (an admin role) noted in
# refresh_placement_drives' own docstring below - this doesn't block
# the scheduler's own independent 24-hour job in scheduler.py, which
# calls sync_all_sources() directly rather than through this route.
_sync_lock = threading.Lock()
_last_sync_attempt: Optional[datetime] = None
SYNC_COOLDOWN_SECONDS = 5 * 60


def _fetch_active_non_expired_drives():
    """
    Same base query list_placement_drives() below uses, plus a
    defensive `deadline >= today` filter on top of `is_active` - the
    24-hour sync job is what actually flips is_active to false for
    expired drives (see placement_drive_service.expire_past_deadline),
    so this guards the worst-case up-to-24h staleness window between
    syncs, using the real current date rather than any hardcoded value.
    """
    response = (
        supabase
        .table("placement_drives")
        .select("*")
        .eq("is_active", True)
        .execute()
    )

    drives = response.data or []
    today = date.today().isoformat()
    return [d for d in drives if not d.get("deadline") or d["deadline"] >= today]


@router.get("/recommended/{email}")
def get_recommended_drives(
    email: str,
    limit: int = Query(default=10, ge=1, le=10),
    auth_email: str = Depends(get_authenticated_email),
):
    """
    "Top 10 Recommended Placement Drives" - ranks active, non-expired
    drives by a blend of student-fit (skills/career goal/department,
    when available) and deadline urgency (see drive_matching_service).
    Deliberately does NOT require Skill Analysis/Career Intelligence to
    exist first (unlike Job Recommendations) - a student with an
    incomplete profile still gets a sensible, deadline-aware ranking
    instead of an error.

    No match percentage is computed or returned here - the ranking
    score is used purely server-side to order the list.
    """
    require_self(email, auth_email)

    try:
        drives = _fetch_active_non_expired_drives()

        profile_res = (
            supabase
            .table("profiles")
            .select("skills, skill_levels, career_goal, department, degree, user_type")
            .eq("email", email)
            .maybe_single()
            .execute()
        )
        profile = profile_res.data if profile_res and profile_res.data else None

        # profiles.skills / career_goal are stored as JSON-encoded
        # strings (see routes/profile.py), not native lists - decoding
        # them here matters, since drive_matching_service builds its
        # relevance signal with `list.extend(profile["skills"])`. Left
        # un-decoded, that silently iterated the JSON string character
        # by character (and treated career_goal as one giant garbage
        # token), quietly degrading every recommendation's relevance
        # score without ever raising an error.
        if profile:
            for field in ("skills", "career_goal"):
                value = profile.get(field)
                if isinstance(value, str):
                    try:
                        profile[field] = json.loads(value)
                    except Exception:
                        profile[field] = []

        career_res = (
            supabase
            .table("career_analysis")
            .select("analysis")
            .eq("email", email)
            .maybe_single()
            .execute()
        )
        career_analysis = (
            career_res.data["analysis"]
            if career_res and career_res.data
            else None
        )

        top = rank_recommended_drives(drives, profile, career_analysis, limit=limit)

        return {
            "success": True,
            "count": len(top),
            "total_active": len(drives),
            "data": top,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise_clean_500(e)


@router.get("")
def list_placement_drives(limit: Optional[int] = Query(default=None, ge=1)):
    """
    Returns every currently active drive, sorted by nearest deadline
    first. `limit` is optional (used by the Dashboard's preview card to
    ask for the top 3 without fetching everything).

    Sorting happens in Python rather than via Postgres .order() because
    a plain ascending sort on a nullable date column puts NULLs first
    by default - which would push every rolling/no-deadline posting to
    the very top, the opposite of "nearest deadline first."
    """
    try:
        response = (
            supabase
            .table("placement_drives")
            .select("*")
            .eq("is_active", True)
            .execute()
        )

        drives = response.data or []
        drives.sort(key=lambda d: (d["deadline"] is None, d["deadline"]))

        if limit is not None:
            drives = drives[:limit]

        return {
            "success": True,
            "count": len(drives),
            "data": drives,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise_clean_500(e)


@router.get("/{drive_id}")
def get_placement_drive(drive_id: str):
    try:
        response = (
            supabase
            .table("placement_drives")
            .select("*")
            .eq("id", drive_id)
            .maybe_single()
            .execute()
        )

        if not response or not response.data:
            raise HTTPException(status_code=404, detail="Drive not found.")

        return {
            "success": True,
            "data": response.data,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise_clean_500(e)


@router.post("/refresh")
def refresh_placement_drives(auth_email: str = Depends(get_authenticated_email)):
    """
    Manually triggers the same sync the 24-hour scheduler runs
    (job_sources -> upsert -> expire). Useful for testing, and for
    forcing an update without waiting for the next scheduled run.

    This app has no admin/role concept anywhere else, so the bar here
    is simply "must be a logged-in user" (auth_email is required but
    intentionally unused beyond that) rather than a full admin check -
    that at least closes the fully-anonymous abuse path against the
    real Greenhouse/Lever calls this triggers. If you add real admin
    roles later, tighten this to check for one.

    Also rate-limited to one attempt per SYNC_COOLDOWN_SECONDS across
    ALL callers combined (not per-user) - see the module-level comment
    above for why.
    """
    _ = auth_email

    global _last_sync_attempt

    with _sync_lock:
        now = datetime.now(timezone.utc)
        if _last_sync_attempt is not None:
            elapsed = (now - _last_sync_attempt).total_seconds()
            if elapsed < SYNC_COOLDOWN_SECONDS:
                retry_after = int(SYNC_COOLDOWN_SECONDS - elapsed)
                raise HTTPException(
                    status_code=429,
                    detail=(
                        "Placement drives were synced recently. "
                        f"Please try again in {retry_after} seconds."
                    ),
                )
        # Recorded before the sync actually runs, not after it
        # succeeds - a failed/slow sync still made real outbound calls
        # to Greenhouse/Lever and should still count against the
        # cooldown, otherwise repeated failures would bypass the limit
        # entirely.
        _last_sync_attempt = now

    try:
        summary = sync_all_sources()
        return {"success": True, "summary": summary}
    except HTTPException:
        raise

    except Exception as e:
        raise_clean_500(e)