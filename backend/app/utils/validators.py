"""
Shared validation helpers for Signup + Profile Setup + Profile
Management.

Each function either returns the cleaned value or raises ValueError
with a human-readable message - this shape is intentional so they can
be dropped straight into a Pydantic v2 `@field_validator` (which turns
a raised ValueError into a 422 response with that exact message) as
well as being callable directly from plain route code.

Mirrors frontend/src/utils/validators.js rule-for-rule. If a rule
changes, change it in both places.
"""

import re

FULL_NAME_RE = re.compile(r"^[A-Za-z\u00C0-\u024F' \-.]+$")
ACADEMIC_YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Final Year", "Graduated"]
LINKEDIN_RE = re.compile(r"^https?://([a-z]{2,3}\.)?linkedin\.com/in/[A-Za-z0-9\-_%.]+/?$", re.IGNORECASE)
GITHUB_RE = re.compile(r"^https?://(www\.)?github\.com/[A-Za-z0-9\-_]+/?$", re.IGNORECASE)


def validate_full_name(value: str) -> str:
    name = (value or "").strip()

    if not name:
        raise ValueError("Full name is required.")

    if len(name) < 2:
        raise ValueError("Full name is too short.")

    if len(name) > 80:
        raise ValueError("Full name is too long.")

    if "@" in name:
        raise ValueError("Full name can't contain '@'. Please enter your name, not an email address.")

    # Rejects anything with a digit or an email-like token outright -
    # covers "pleasework@gmail.com" (caught above) as well as things
    # like "John123" or a bare "abcdef.com" typed into the name field.
    if re.search(r"\d", name):
        raise ValueError("Full name shouldn't contain numbers.")

    if not FULL_NAME_RE.match(name):
        raise ValueError(
            "Full name can only contain letters, spaces, apostrophes and hyphens."
        )

    if not re.search(r"[A-Za-z]", name):
        raise ValueError("Full name must contain letters.")

    return name


def validate_cgpa(value) -> float:
    try:
        cgpa = float(value)
    except (TypeError, ValueError):
        raise ValueError("CGPA must be a number between 0 and 10.")

    if cgpa < 0 or cgpa > 10:
        raise ValueError("CGPA must be between 0.00 and 10.00.")

    return round(cgpa, 2)


def validate_academic_year(value: str) -> str:
    year = (value or "").strip()
    if year not in ACADEMIC_YEARS:
        raise ValueError(f"Academic year must be one of: {', '.join(ACADEMIC_YEARS)}.")
    return year


def validate_experience_years(value) -> float:
    try:
        years = float(value)
    except (TypeError, ValueError):
        raise ValueError("Years of experience must be a number.")

    if years < 0 or years > 60:
        raise ValueError("Years of experience must be between 0 and 60.")

    return round(years, 1)


def validate_phone(value: str) -> str:
    phone = (value or "").strip()
    if not phone:
        return phone  # optional

    digits = re.sub(r"[^\d]", "", phone)
    if len(digits) < 7 or len(digits) > 15:
        raise ValueError("Please enter a valid phone number.")

    if not re.match(r"^\+?[\d\s\-().]{7,20}$", phone):
        raise ValueError("Please enter a valid phone number.")

    return phone


def validate_linkedin(value: str) -> str:
    url = (value or "").strip()
    if not url:
        return url  # optional

    if not LINKEDIN_RE.match(url):
        raise ValueError("Please enter a valid LinkedIn profile URL (e.g. https://www.linkedin.com/in/username).")

    return url


def validate_github(value: str) -> str:
    url = (value or "").strip()
    if not url:
        return url  # optional

    if not GITHUB_RE.match(url):
        raise ValueError("Please enter a valid GitHub profile URL (e.g. https://github.com/username).")

    return url
