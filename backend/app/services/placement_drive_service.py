import json
import logging
from datetime import date, datetime, timedelta, timezone

from app.database.db import supabase
from app.services.job_sources.base import DriveListing
from app.services.job_sources.registry import get_all_connectors
from app.services.drive_matching_service import _score_relevance, _student_signal_text
from app.services.notification_service import create_notification

logger = logging.getLogger(__name__)

# How far ahead of a drive's deadline students start getting notified.
DEADLINE_REMINDER_WINDOW_DAYS = 3

# Below this Jaccard overlap (see drive_matching_service._score_relevance)
# a drive isn't considered relevant enough to a given student to notify
# them about its deadline - deliberately low, since a notification is a
# much lighter touch than ranking a drive #1 in Recommended Drives, and
# missing a genuinely relevant deadline is worse than an occasional
# loosely-relevant reminder.
DEADLINE_REMINDER_RELEVANCE_THRESHOLD = 0.05


def _listing_to_row(listing: DriveListing) -> dict:
    return {
        "company_name": listing.company_name,
        "company_logo": listing.company_logo,
        "role": listing.role,
        "employment_type": listing.employment_type,
        "location": listing.location,
        "salary": listing.salary,
        "deadline": listing.deadline,
        "description": listing.description,
        "apply_url": listing.apply_url,
        "url_type": listing.url_type,
        "source": listing.source,
        "source_ref": listing.source_ref,
        "is_active": True,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def sync_all_sources() -> dict:
    """
    Runs every registered connector (see job_sources/registry.py) and
    reconciles the results into placement_drives. This is the single
    function both the 24-hour scheduler (scheduler.py) and the manual
    POST /placement-drives/refresh route call - there is only one sync
    code path.

    For each connector, in order:

      1. fetch() postings and upsert them, keyed on
         UNIQUE(source, source_ref) - a posting seen before is updated
         in place (title, location, etc. may have changed) instead of
         duplicated. This is what "prevent duplicates" and "update
         changed opportunities" actually mean at the database level.

      2. Deactivate (never delete) any row that belongs to this source
         but wasn't in this run's results - it was pulled, filled, or
         closed upstream. Skipped for source == "manual": see
         ManualSourceConnector's docstring for why that source can
         never have anything "missing" from its own fetch.

    If a connector's fetch() raises (network error, renamed board, malformed
    response, etc.), that source is skipped entirely for this run -
    both the upsert step and the "deactivate missing" step - so a
    temporary outage can never be misread as "this company has zero
    open roles" and wipe out real, still-open postings. Existing rows
    for that source are simply left as they were until the next
    successful run.

    Deadline-based expiry runs last, once, across every row regardless
    of source or which connectors succeeded this cycle.
    """

    summary = {
        "sources_synced": 0,
        "sources_failed": 0,
        "upserted": 0,
        "deactivated": 0,
    }

    for connector in get_all_connectors():
        try:
            listings = connector.fetch()
        except Exception:
            logger.exception("Job source '%s' failed to fetch - leaving its existing rows untouched this cycle.", connector.name)
            summary["sources_failed"] += 1
            continue

        summary["sources_synced"] += 1
        seen_refs = []

        for listing in listings:
            if not listing.source_ref:
                # Can't dedupe or track this posting without a stable
                # ref - skip it rather than risk a duplicate/unstable row.
                continue

            supabase.table("placement_drives").upsert(
                _listing_to_row(listing),
                on_conflict="source,source_ref",
            ).execute()

            seen_refs.append(listing.source_ref)

        summary["upserted"] += len(seen_refs)

        if connector.name == "manual":
            continue

        existing = (
            supabase
            .table("placement_drives")
            .select("id, source_ref")
            .eq("source", connector.name)
            .eq("is_active", True)
            .execute()
        )

        stale_ids = [
            row["id"]
            for row in (existing.data or [])
            if row["source_ref"] not in seen_refs
        ]

        if stale_ids:
            supabase.table("placement_drives").update(
                {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}
            ).in_("id", stale_ids).execute()

            summary["deactivated"] += len(stale_ids)

    # Deadline-based expiry - independent of which connectors succeeded
    # this cycle, applies to every source including manual postings.
    today = date.today().isoformat()

    expired = (
        supabase
        .table("placement_drives")
        .update({"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()})
        .lt("deadline", today)
        .eq("is_active", True)
        .execute()
    )

    summary["deactivated"] += len(expired.data or [])

    return summary


def notify_upcoming_deadlines() -> None:
    """
    Best-effort - see notification_service.py. Notifies each student
    about active drives relevant to them whose deadline falls within
    DEADLINE_REMINDER_WINDOW_DAYS. Called once per scheduler cycle
    (every 24h) right after sync_all_sources(), and wrapped there in
    its own try/except (see scheduler.py) so a failure here can never
    take down the drives sync itself.

    Relevance reuses drive_matching_service's own scoring (token
    overlap between the drive's role/description and the student's
    skills/career-goal/department/recommended-role) rather than a
    second, separate notion of "relevant" - same signal Recommended
    Placement Drives itself ranks by, just applied as a low threshold
    instead of a ranking.

    Dedup is permanent (create_notification's dedup_window_minutes=
    None) and the notification title already encodes the specific
    drive (company + role), so the same drive's deadline is never
    notified twice as it gets closer across daily runs - only the
    first run where it enters the reminder window ever notifies.
    """
    today = date.today()
    window_end = (today + timedelta(days=DEADLINE_REMINDER_WINDOW_DAYS)).isoformat()

    drives_resp = (
        supabase
        .table("placement_drives")
        .select("id, company_name, role, description")
        .eq("is_active", True)
        .gte("deadline", today.isoformat())
        .lte("deadline", window_end)
        .execute()
    )
    drives = drives_resp.data or []
    if not drives:
        return

    # Only students with a genuinely completed profile get considered -
    # matches the "full_name is not null" completeness signal already
    # used elsewhere (e.g. dashboard.py's profile_strength check).
    profiles_resp = (
        supabase
        .table("profiles")
        .select("email, skills, skill_levels, career_goal, department, degree")
        .not_.is_("full_name", "null")
        .execute()
    )
    profiles = profiles_resp.data or []
    if not profiles:
        return

    for profile in profiles:
        for field in ("skills", "career_goal"):
            value = profile.get(field)
            if isinstance(value, str):
                try:
                    profile[field] = json.loads(value)
                except Exception:
                    profile[field] = []

        signal_text = _student_signal_text(profile, None)
        if not signal_text.strip():
            continue

        for drive in drives:
            relevance = _score_relevance(drive, signal_text)
            if relevance is None or relevance < DEADLINE_REMINDER_RELEVANCE_THRESHOLD:
                continue

            role = drive.get("role") or "a role"
            company = drive.get("company_name") or "a company"

            create_notification(
                email=profile["email"],
                notif_type="drive_deadline",
                title=f"Deadline approaching: {role} at {company}",
                message="A relevant placement drive is closing soon.",
                link="/placement-drives",
                dedup_window_minutes=None,
            )