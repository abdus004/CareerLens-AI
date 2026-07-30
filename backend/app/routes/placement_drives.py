from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.database.db import supabase
from app.services.placement_drive_service import sync_all_sources

router = APIRouter(
    prefix="/placement-drives",
    tags=["Placement Drives"]
)


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