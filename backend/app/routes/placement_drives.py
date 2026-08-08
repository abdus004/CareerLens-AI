from typing import Optional
from datetime import date

from fastapi import APIRouter, HTTPException, Query

from app.database.db import supabase
from app.services.placement_drive_service import sync_all_sources
from app.services.drive_matching_service import rank_recommended_drives

router = APIRouter(
    prefix="/placement-drives",
    tags=["Placement Drives"]
)


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
def get_recommended_drives(email: str, limit: int = Query(default=10, ge=1, le=10)):
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
    try:
        drives = _fetch_active_non_expired_drives()

        profile_res = (
            supabase
            .table("profiles")
            .select("skills, skill_levels, career_goal, department, degree")
            .eq("email", email)
            .maybe_single()
            .execute()
        )
        profile = profile_res.data if profile_res and profile_res.data else None

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

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refresh")
def refresh_placement_drives():
    """
    Manually triggers the same sync the 24-hour scheduler runs
    (job_sources -> upsert -> expire). Useful for testing, and for
    forcing an update without waiting for the next scheduled run.
    """
    try:
        summary = sync_all_sources()
        return {"success": True, "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))