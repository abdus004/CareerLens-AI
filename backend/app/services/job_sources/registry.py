from typing import List

from .base import SourceConnector
from .greenhouse_source import GreenhouseConnector
from .lever_source import LeverConnector
from .manual_source import ManualSourceConnector

# ---------------------------------------------------------------------
# Add a new Greenhouse or Lever company by adding one entry below - no
# other file needs to change.
#
# board_token / site = the last segment of the company's public board
# URL:
#   Greenhouse: https://boards.greenhouse.io/<board_token>
#   Lever:      https://jobs.lever.co/<site>
#
# company_logo is optional (falls back to a placeholder icon in the UI
# if left blank).
#
# Stripe is left in as a working, verified example so the pipeline can
# be proven end-to-end immediately - remove it once you've added the
# companies you actually want.
# ---------------------------------------------------------------------

GREENHOUSE_COMPANIES = [
    {
        "board_token": "stripe",
        "company_name": "Stripe",
        "company_logo": "https://logo.clearbit.com/stripe.com",
    },
    # {"board_token": "", "company_name": "", "company_logo": ""},
]

LEVER_COMPANIES = [
    # {"site": "", "company_name": "", "company_logo": ""},
]


def get_all_connectors() -> List[SourceConnector]:
    connectors: List[SourceConnector] = []

    for entry in GREENHOUSE_COMPANIES:
        connectors.append(GreenhouseConnector(**entry))

    for entry in LEVER_COMPANIES:
        connectors.append(LeverConnector(**entry))

    # Always present - this is what makes manually-added postings for
    # Google/Microsoft/Amazon/etc. show up and expire correctly.
    connectors.append(ManualSourceConnector())

    return connectors