from typing import List, Optional

from pydantic import BaseModel, field_validator, model_validator

from app.database.db import SUPABASE_URL
from app.utils.validators import (
    validate_full_name,
    validate_cgpa,
    validate_academic_year,
    validate_experience_years,
    validate_phone,
    validate_linkedin,
    validate_github,
)

USER_TYPES = ("Student", "Job Seeker")

# The only legitimate source of profiles.resume_url is the resume
# upload flow itself (routes/resume.py's public_url, which always
# comes from supabase.storage.from_("resumes").get_public_url(...)).
# Previously this field accepted any client-supplied string and wrote
# it straight into the database - and routes/dashboard.py's
# _backfill_ai_suggestions later fetches that exact URL server-side
# (requests.get) whenever ai_suggestions is empty. That meant an
# authenticated user could point their OWN resume_url at an internal/
# private address and get the backend to make a request to it (SSRF)
# just by loading their own Dashboard afterward - no ownership bypass
# needed, since it was entirely within an otherwise-legitimate "edit
# my own profile" call. Rejecting anything outside this project's own
# Supabase Storage domain here closes that off at the one place this
# value is ever accepted from a client.
RESUME_PUBLIC_URL_PREFIX = f"{(SUPABASE_URL or '').rstrip('/')}/storage/v1/object/public/resumes/"


class ProfileCreate(BaseModel):
    full_name: str
    email: str
    phone: str = ""
    gender: str
    age: int

    linkedin: str = ""
    github: str = ""

    # Selected in Profile Setup step 1 (components/profile/UserType.jsx).
    # Optional at the model level (kept "" for very old rows / partial
    # saves) but the frontend requires a selection before the wizard
    # can proceed, so in practice this is always populated going
    # forward. See routes/profile.py + the matching/recommendation
    # services for where this actually changes behavior.
    user_type: str = ""

    college: str = ""
    department: str = ""
    degree: str = ""
    year: str = ""       # Academic Year (Student) - e.g. "3rd Year". See validators.ACADEMIC_YEARS.
    cgpa: str = ""        # Student only, 0.00-10.00

    # Job Seeker only.
    experience_years: Optional[float] = None

    career_goal: List[str] = []
    skills: List[str] = []
    interests: List[str] = []

    resume_url: str = ""

    @field_validator("full_name")
    @classmethod
    def _full_name(cls, value: str) -> str:
        return validate_full_name(value)

    @field_validator("user_type")
    @classmethod
    def _user_type(cls, value: str) -> str:
        value = (value or "").strip()
        if value and value not in USER_TYPES:
            raise ValueError(f"user_type must be one of: {', '.join(USER_TYPES)}.")
        return value

    @field_validator("phone")
    @classmethod
    def _phone(cls, value: str) -> str:
        return validate_phone(value)

    @field_validator("linkedin")
    @classmethod
    def _linkedin(cls, value: str) -> str:
        return validate_linkedin(value)

    @field_validator("github")
    @classmethod
    def _github(cls, value: str) -> str:
        return validate_github(value)

    @field_validator("age")
    @classmethod
    def _age(cls, value: int) -> int:
        if value < 13 or value > 100:
            raise ValueError("Please enter a realistic age.")
        return value

    @field_validator("resume_url")
    @classmethod
    def _resume_url(cls, value: str) -> str:
        value = (value or "").strip()
        if not value:
            return value
        if not value.startswith(RESUME_PUBLIC_URL_PREFIX):
            raise ValueError(
                "resume_url must be a URL from this project's own resume storage."
            )
        return value

    @model_validator(mode="after")
    def _conditional_education_or_experience(self):
        """
        CGPA and Academic Year only make sense for Students; Years of
        Experience only makes sense for Job Seekers. Validated here
        (not as plain field validators) because which rule applies
        depends on user_type, a sibling field.

        Values simply left blank are allowed through untouched (Profile
        Setup collects these progressively, and a legacy/unset
        user_type must not start rejecting saves that used to work) -
        this only rejects values that were actually PROVIDED but are
        invalid for the current user_type or out of range.
        """
        if self.user_type == "Student":
            if self.cgpa:
                self.cgpa = str(validate_cgpa(self.cgpa))
            if self.year:
                self.year = validate_academic_year(self.year)
            # Experience isn't a Student concept - never persist a
            # stray value for it even if one was somehow sent.
            self.experience_years = None

        elif self.user_type == "Job Seeker":
            if self.experience_years is not None:
                self.experience_years = validate_experience_years(self.experience_years)
            # Don't force CGPA / Academic Year on Job Seekers - clear
            # rather than validate, so an old value from before a
            # user_type switch can't linger and display incorrectly.
            self.cgpa = ""
            self.year = ""

        else:
            # user_type not set (legacy row / mid-wizard save) - accept
            # whichever of the two was actually provided, validated on
            # its own terms, without forcing a choice.
            if self.cgpa:
                self.cgpa = str(validate_cgpa(self.cgpa))
            if self.year:
                self.year = validate_academic_year(self.year)
            if self.experience_years is not None:
                self.experience_years = validate_experience_years(self.experience_years)

        return self