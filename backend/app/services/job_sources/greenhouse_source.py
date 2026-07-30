from typing import List

import requests

from .base import DriveListing, SourceConnector, guess_employment_type, strip_html

GREENHOUSE_API_BASE = "https://boards-api.greenhouse.io/v1/boards"


class GreenhouseConnector(SourceConnector):
    """
    Pulls live postings from a company's public Greenhouse Job Board
    API (https://developers.greenhouse.io/job-board.html). This
    endpoint is public and unauthenticated - no scraping, no API key.

    One instance covers one company. registry.py lists which companies
    (board tokens) to poll; adding another Greenhouse company is a
    one-line addition there, not a code change here.

    `board_token` is the last segment of the company's public board
    URL: https://boards.greenhouse.io/<board_token>
    """

    name = "greenhouse"

    def __init__(self, board_token: str, company_name: str, company_logo: str = ""):
        self.board_token = board_token
        self.company_name = company_name
        self.company_logo = company_logo

    def fetch(self) -> List[DriveListing]:
        url = f"{GREENHOUSE_API_BASE}/{self.board_token}/jobs?content=true"

        # Deliberately NOT caught here - a network error/renamed board
        # must propagate up to placement_drive_service.sync_all_sources,
        # which treats "this source's fetch raised" as "leave its
        # existing rows alone this cycle" rather than "this company has
        # zero open roles now, deactivate everything."
        response = requests.get(url, timeout=15)
        response.raise_for_status()

        jobs = response.json().get("jobs", [])
        listings: List[DriveListing] = []

        for job in jobs:
            job_id = job.get("id")
            if job_id is None:
                continue

            title = job.get("title", "")
            location = (job.get("location") or {}).get("name", "")
            apply_url = job.get("absolute_url", "")

            listings.append(
                DriveListing(
                    company_name=self.company_name,
                    role=title,
                    source=self.name,
                    source_ref=str(job_id),
                    employment_type=guess_employment_type(title),
                    location=location,
                    salary="",  # Greenhouse's public job board API does not expose compensation
                    deadline=None,  # Greenhouse postings are open-until-filled; no deadline field
                    description=strip_html(job.get("content", ""))[:2000],
                    apply_url=apply_url,
                    url_type="direct" if apply_url else "careers_page",
                    company_logo=self.company_logo,
                )
            )

        return listings