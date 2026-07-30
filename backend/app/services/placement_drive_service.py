import logging
from datetime import date, datetime, timezone

from app.database.db import supabase
from app.services.job_sources.base import DriveListing
from app.services.job_sources.registry import get_all_connectors

logger = logging.getLogger(__name__)


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