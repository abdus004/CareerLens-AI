import html
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class DriveListing:
    """
    Normalized shape every job source must return, regardless of where
    the data actually came from. placement_drive_service.py only ever
    works with this shape - it never needs to know whether a listing
    came from Greenhouse, Lever, or a manually added row. That's what
    makes adding a new source later a matter of adding one new file
    that returns a list of these, not touching anything else.
    """

    company_name: str
    role: str
    source: str            # e.g. "greenhouse", "lever", "manual"
    source_ref: str        # the source's own stable id for this posting -
                            # this is what the UNIQUE(source, source_ref)
                            # constraint dedupes on
    employment_type: str = "Full Time"   # "Internship" | "Graduate Program" | "Full Time"
    location: str = ""
    salary: str = ""
    deadline: Optional[str] = None       # ISO date ("YYYY-MM-DD"), or None = rolling/no fixed deadline
    description: str = ""
    apply_url: str = ""
    url_type: str = "careers_page"       # "direct" | "careers_page"
    company_logo: str = ""


class SourceConnector(ABC):
    """
    Every job source implements exactly this one method. The sync
    service (placement_drive_service.py) and the registry
    (registry.py) are the only two places that ever import a concrete
    connector - everything else in the app only deals in DriveListing
    objects.

    To add a new source later (another ATS, a licensed jobs API, a
    verified scraper, etc.):
      1. Add a new file here implementing SourceConnector.
      2. Register an instance of it in registry.py.
    Nothing else changes - not the sync logic, not the API routes, not
    the frontend.
    """

    name: str = "base"

    @abstractmethod
    def fetch(self) -> List[DriveListing]:
        """
        Returns every currently-open posting this source knows about,
        as a fresh list on every call. Raise on failure (network error,
        etc.) rather than returning an empty list - the sync service
        treats "raised an exception" and "successfully fetched zero
        postings" very differently: a real failure must never be read
        as "this company has no open roles right now."
        """
        raise NotImplementedError


def strip_html(raw_html: str) -> str:
    """Best-effort plain-text extraction from an ATS's HTML job description."""
    text = re.sub(r"<[^>]+>", " ", raw_html or "")
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


_INTERNSHIP_HINTS = ("intern", "internship")
_GRAD_HINTS = ("new grad", "new-grad", "graduate program", "campus", "early career", "university grad")


def guess_employment_type(title: str) -> str:
    """
    ATS public APIs (Greenhouse, Lever) don't standardize an
    "employment type" field the way this app's schema requires, so it
    has to be inferred from the job title. Defaults to "Full Time",
    which is deliberately the safest/most common guess when a title
    gives no signal either way.
    """
    lowered = (title or "").lower()

    if any(hint in lowered for hint in _INTERNSHIP_HINTS):
        return "Internship"

    if any(hint in lowered for hint in _GRAD_HINTS):
        return "Graduate Program"

    return "Full Time"