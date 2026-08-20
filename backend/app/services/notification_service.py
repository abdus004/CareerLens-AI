"""
Shared helper for creating rows in the `notifications` table (see
migrations/2026_08_19_create_notifications_table.sql). Every backend
service that produces a meaningful, user-visible update (resume
analysis, skill analysis, career recommendations, learning path, job
recommendations, placement drive deadlines, certificates) calls
create_notification() directly as a plain Python function - the same
"reused, not duplicated" pattern already used for
run_profile_resume_analysis, run_skill_analysis, etc.

Deliberately does NOT raise on failure: notification creation is a
side effect of some other, already-successful operation (a resume was
analyzed, a certificate was saved, ...) and must never turn that
already-successful operation into a 500 just because the notifications
insert itself failed.
"""

from datetime import datetime, timedelta, timezone

from app.database.db import supabase


def create_notification(
    email: str,
    notif_type: str,
    title: str,
    message: str,
    link: str | None = None,
    dedup_window_minutes: int | None = 5,
) -> dict | None:
    """
    Inserts a user-specific notification, with a dedup check first so
    the same backend operation firing more than once in quick
    succession (a retried request, Reanalyze cascading through
    skills -> career -> learning path, a double form submit) doesn't
    create duplicate notifications - see section 8 of the brief this
    was built against ("DO NOT SPAM USERS").

    dedup_window_minutes:
      - int (default 5): skip if an identical (email, type, title)
        notification was already created within the last N minutes.
        Right for recurring events whose title text is generic and
        reused across separate real occurrences over time (e.g.
        "Resume analysis completed" happening again next month after
        a genuine re-upload SHOULD still notify).
      - None: skip if an identical (email, type, title) notification
        was EVER created. Right for one-time events whose title
        already encodes what makes them unique (e.g. a specific
        drive's company + role), so that specific event is never
        notified twice no matter how much time passes - used by
        placement_drive_service.py for deadline reminders, which
        would otherwise re-fire on every daily sync until the
        deadline passes.

    Returns the inserted row, or None if it was deduped or the insert
    failed (failures are swallowed - see module docstring).
    """
    try:
        query = (
            supabase
            .table("notifications")
            .select("id")
            .eq("email", email)
            .eq("type", notif_type)
            .eq("title", title)
        )

        if dedup_window_minutes is not None:
            cutoff = (
                datetime.now(timezone.utc) - timedelta(minutes=dedup_window_minutes)
            ).isoformat()
            query = query.gte("created_at", cutoff)

        existing = query.limit(1).execute()
        if existing and existing.data:
            return None

        row = {
            "email": email,
            "type": notif_type,
            "title": title,
            "message": message,
            "link": link,
            "is_read": False,
        }

        result = supabase.table("notifications").insert(row).execute()
        return result.data[0] if result and result.data else None

    except Exception as e:
        print(f"[notifications] failed to create '{title}' for {email}: {e}")
        return None
