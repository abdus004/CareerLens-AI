from typing import List

from app.database.db import supabase

from .base import DriveListing, SourceConnector


class ManualSourceConnector(SourceConnector):
    """
    Backs every company with no public job-board API - Google,
    Microsoft, Amazon, Infosys, TCS, Oracle, IBM, Accenture, Deloitte,
    and anyone else not on Greenhouse or Lever - until an official
    API/connector for them exists.

    There is nothing to fetch from the outside world here. A manual
    posting is added directly as a row in placement_drives with
    source = 'manual' (via Supabase Studio, or any tool that can
    insert into that table) and a source_ref you choose yourself - any
    unique string, e.g. "google-swe-intern-2026". This connector's
    fetch() just reads those rows back out in the same DriveListing
    shape every other connector uses, so:

      - adding a posting is a plain database insert - no code change,
        no deploy
      - the UNIQUE(source, source_ref) constraint still prevents you
        from accidentally adding the same posting twice
      - deadline-based expiry (in placement_drive_service.py) still
        applies automatically, exactly like a Greenhouse/Lever posting
      - deleting the row directly in Supabase removes it from the feed
        immediately - fetch() returning "not there anymore" IS the
        removal, nothing extra to clean up

    This is also why placement_drive_service.sync_all_sources()
    skips the "delist anything not in this fetch" step specifically
    for source == "manual": this connector's fetch() by definition
    always returns exactly what's currently in the table for it, so
    there is never anything "missing" to delist.
    """

    name = "manual"

    def fetch(self) -> List[DriveListing]:
        response = (
            supabase
            .table("placement_drives")
            .select("*")
            .eq("source", "manual")
            .execute()
        )

        listings: List[DriveListing] = []

        for row in response.data or []:
            source_ref = row.get("source_ref")
            if not source_ref:
                continue

            listings.append(
                DriveListing(
                    company_name=row["company_name"],
                    role=row["role"],
                    source="manual",
                    source_ref=source_ref,
                    employment_type=row.get("employment_type") or "Full Time",
                    location=row.get("location") or "",
                    salary=row.get("salary") or "",
                    deadline=row.get("deadline"),
                    description=row.get("description") or "",
                    apply_url=row.get("apply_url") or "",
                    url_type=row.get("url_type") or "careers_page",
                    company_logo=row.get("company_logo") or "",
                )
            )

        return listings