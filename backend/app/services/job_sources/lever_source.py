from typing import List

import requests

from .base import DriveListing, SourceConnector, guess_employment_type

LEVER_API_BASE = "https://api.lever.co/v0/postings"


class LeverConnector(SourceConnector):
    """
    Pulls live postings from a company's public Lever postings API -
    public and unauthenticated, no scraping.

    One instance covers one company. `site` is the last segment of the
    company's public Lever board URL: https://jobs.lever.co/<site>
    """

    name = "lever"

    def __init__(self, site: str, company_name: str, company_logo: str = ""):
        self.site = site
        self.company_name = company_name
        self.company_logo = company_logo

    def fetch(self) -> List[DriveListing]:
        url = f"{LEVER_API_BASE}/{self.site}?mode=json"

        # Same reasoning as GreenhouseConnector: let this raise so a
        # fetch failure never gets mistaken for "zero open roles."
        response = requests.get(url, timeout=15)
        response.raise_for_status()

        postings = response.json()
        listings: List[DriveListing] = []

        for posting in postings:
            posting_id = posting.get("id")
            if not posting_id:
                continue

            title = posting.get("text", "")
            categories = posting.get("categories") or {}
            location = categories.get("location", "") or ""
            commitment = (categories.get("commitment") or "").lower()

            if "intern" in commitment or "intern" in title.lower():
                employment_type = "Internship"
            else:
                employment_type = guess_employment_type(title)

            apply_url = posting.get("applyUrl") or posting.get("hostedUrl", "")

            listings.append(
                DriveListing(
                    company_name=self.company_name,
                    role=title,
                    source=self.name,
                    source_ref=str(posting_id),
                    employment_type=employment_type,
                    location=location,
                    salary="",  # Lever's public postings API does not expose compensation
                    deadline=None,  # Lever postings are open-until-filled; no deadline field
                    description=(posting.get("descriptionPlain") or "")[:2000],
                    apply_url=apply_url,
                    url_type="direct" if apply_url else "careers_page",
                    company_logo=self.company_logo,
                )
            )

        return listings