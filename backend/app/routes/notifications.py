from fastapi import APIRouter, Depends, HTTPException

from app.database.db import supabase
from app.utils.security import get_authenticated_email, require_self

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)

# Keeps the bell dropdown fast and the payload small - this is a
# recency feed, not an archive. Matches the "avoid unnecessary API
# calls" / "don't overengineer" guidance: no pagination for a first
# version, just the most recent slice.
MAX_NOTIFICATIONS = 50


@router.get("/{email}")
def get_notifications(
    email: str,
    auth_email: str = Depends(get_authenticated_email),
):
    """
    Returns this user's most recent notifications (newest first) plus
    an unread_count for the bell badge. Ownership is enforced via
    require_self() - a user can only ever read their own notifications
    (see migrations/2026_08_19_create_notifications_table.sql for why
    this is done in the app layer rather than RLS).
    """
    require_self(email, auth_email)

    try:
        response = (
            supabase
            .table("notifications")
            .select("*")
            .eq("email", email)
            .order("created_at", desc=True)
            .limit(MAX_NOTIFICATIONS)
            .execute()
        )
        notifications = response.data or []
        unread_count = sum(1 for n in notifications if not n.get("is_read"))

        return {
            "success": True,
            "notifications": notifications,
            "unread_count": unread_count,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{email}/{notification_id}/read")
def mark_notification_read(
    email: str,
    notification_id: str,
    auth_email: str = Depends(get_authenticated_email),
):
    """
    Marks a single notification as read. The .eq("email", email) below
    isn't just a filter - combined with require_self() above it's what
    stops one user from marking (or even targeting) another user's
    notification by guessing an id.
    """
    require_self(email, auth_email)

    try:
        supabase \
            .table("notifications") \
            .update({"is_read": True}) \
            .eq("id", notification_id) \
            .eq("email", email) \
            .execute()

        return {"success": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{email}/read-all")
def mark_all_notifications_read(
    email: str,
    auth_email: str = Depends(get_authenticated_email),
):
    """Marks every currently-unread notification for this user as read."""
    require_self(email, auth_email)

    try:
        supabase \
            .table("notifications") \
            .update({"is_read": True}) \
            .eq("email", email) \
            .eq("is_read", False) \
            .execute()

        return {"success": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
