"""
Deterministic Job Recommendations matching engine.

This module intentionally contains NO calls to Gemini and NO database
access. It only takes plain Python data (already fetched by the route)
and returns numeric match scores. This split is deliberate and mirrors
the Job Recommendations spec directly:

    Gemini must NOT generate jobs, calculate AI Match, filter jobs, or
    rank jobs. It is only ever used to write short narrative text
    ("why this job matches you", the missing-skill explanation, and
    suggested next steps) - see ai/prompts.py:job_match_explanation_prompt
    and routes/jobs.py.

Weights (of whichever factors ARE available for a given user - see
`_redistribute` behaviour inside compute_match):

    Skills Match                50%
    Career Alignment            30%
    Education Fit               10%
    Projects / Practical Exp.   10%

Resume quality (resume_score / ats_score / grammar_score / keyword_score
/ formatting_score, all from the `resume_analysis` table) is
intentionally NOT a factor here, by explicit design decision. Resume
Analysis measures how well a resume is *written*; Job Recommendations
measures whether the user is a good *fit* for a job based on ability,
qualifications and interests. Mixing the two would penalize an
otherwise-qualified candidate for an unpolished resume, and would make
this module implicitly depend on the `resume_analysis` table, which it
must not.

Every match percentage returned here is a genuine blend of several
independent continuous signals (skill proficiency %, textual role
similarity, CGPA ratio, project overlap), so it naturally lands on
non-round numbers like 91, 88, 84, 82... - no artificial jitter or
randomness is added, and none should ever be added.
"""

import hashlib
import json
import re


WEIGHTS = {
    "skills": 50,
    "career": 30,
    "education": 10,
    "projects": 10,
}

# A required skill the user listed on their profile/resume but that
# Skill Analysis hasn't AI-scored yet still counts for something - just
# less than a skill with a real, verified proficiency score.
UNSCORED_SKILL_CREDIT = 0.4


# ------------------------------------------------------------------
# Text similarity helpers (used for Career Alignment + Education Fit,
# since both job.role_category/preferred_departments and the user's
# career_analysis roles / profile.department are free text, not a
# fixed enum, on both sides).
# ------------------------------------------------------------------

def _normalize(text) -> str:
    if not text:
        return ""
    text = str(text).lower().strip()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _tokens(text) -> set:
    return set(_normalize(text).split())


def _jaccard(a, b) -> float:
    ta, tb = _tokens(a), _tokens(b)
    if not ta or not tb:
        return 0.0
    union = ta | tb
    if not union:
        return 0.0
    return len(ta & tb) / len(union)


# ------------------------------------------------------------------
# Individual factor scorers. Each returns a fraction between 0 and 1,
# or None if there isn't enough data to score that factor at all for
# this user (in which case compute_match redistributes its weight
# across the remaining factors instead of guessing).
# ------------------------------------------------------------------

def _score_skills(job: dict, profile: dict):
    """
    Compares the job's required_skills against the user's skill_levels
    (the AI-scored proficiency values Skill Analysis writes to
    profiles.skill_levels - the same field the existing career/skill
    prompts already treat as the primary source of truth). Falls back
    to a smaller credit for skills the user listed but that haven't
    been AI-scored yet, and 0 for skills the user doesn't have at all.
    """
    required = job.get("required_skills") or []
    if not required:
        return None, [], []

    skill_levels = profile.get("skill_levels") or {}
    skill_levels_lower = {str(k).lower(): v for k, v in skill_levels.items()}

    profile_skills = profile.get("skills") or []
    profile_skills_lower = {str(s).lower() for s in profile_skills}

    matched = []
    missing = []
    total = 0.0

    for skill in required:
        key = str(skill).lower()

        if key in skill_levels_lower:
            raw_score = skill_levels_lower[key] or 0
            try:
                raw_score = float(raw_score)
            except (TypeError, ValueError):
                raw_score = 0
            total += max(0.0, min(100.0, raw_score)) / 100
            matched.append(skill)
        elif key in profile_skills_lower:
            total += UNSCORED_SKILL_CREDIT
            matched.append(skill)
        else:
            missing.append(skill)

    fraction = total / len(required)
    return fraction, matched, missing


def _score_career(job: dict, career_analysis: dict):
    """
    Compares this job's role against every role Career Intelligence
    scored for the user (top_roles + recommended_role/match_score),
    using text-overlap similarity, and takes the best combined signal:
    similarity-to-this-job * Gemini's-own-confidence-in-that-role.
    """
    if not career_analysis:
        return None

    candidates = list(career_analysis.get("top_roles") or [])

    recommended_role = career_analysis.get("recommended_role")
    recommended_score = career_analysis.get("match_score")
    if recommended_role and recommended_score is not None:
        candidates.append({"role": recommended_role, "score": recommended_score})

    if not candidates:
        return None

    job_role_text = f"{job.get('role_category', '')} {job.get('role_title', '')}"

    best = 0.0
    for candidate in candidates:
        role = candidate.get("role")
        score = candidate.get("score")
        if not role or score is None:
            continue
        try:
            score = float(score)
        except (TypeError, ValueError):
            continue

        similarity = _jaccard(job_role_text, role)
        fraction = similarity * (max(0.0, min(100.0, score)) / 100)
        best = max(best, fraction)

    return best


def _score_cgpa_fit(job: dict, profile: dict) -> float:
    min_cgpa = job.get("min_cgpa")
    if min_cgpa is None:
        return 1.0
    try:
        cgpa = float(profile.get("cgpa"))
        min_cgpa_f = float(min_cgpa)
        if cgpa >= min_cgpa_f:
            return 1.0
        elif min_cgpa_f > 0:
            return max(0.0, min(1.0, cgpa / min_cgpa_f))
        return 1.0
    except (TypeError, ValueError):
        # CGPA missing, blank, or not a plain number - can't verify
        # against the requirement, so this neither helps nor hurts.
        return 0.5


def _score_experience_fit(job: dict, profile: dict) -> float:
    """
    Job Seeker analogue of _score_cgpa_fit: compares the candidate's
    experience_years (profiles.experience_years, collected only for
    user_type = Job Seeker) against the job's experience_min/max
    range. Mirrors the same "missing data neither helps nor hurts"
    convention as the CGPA path above.
    """
    exp_min = job.get("experience_min")
    exp_max = job.get("experience_max")

    try:
        candidate_years = float(profile.get("experience_years"))
    except (TypeError, ValueError):
        return 0.5

    try:
        exp_min_f = float(exp_min) if exp_min is not None else 0.0
    except (TypeError, ValueError):
        exp_min_f = 0.0

    if candidate_years >= exp_min_f:
        if exp_max is None:
            return 1.0
        try:
            exp_max_f = float(exp_max)
        except (TypeError, ValueError):
            return 1.0
        # Comfortably inside the range is a full match; noticeably
        # over-qualified tapers off slightly rather than dropping hard,
        # since an over-qualified candidate is still usually viable.
        if candidate_years <= exp_max_f:
            return 1.0
        overshoot = candidate_years - exp_max_f
        return max(0.6, 1.0 - (overshoot / 10))

    if exp_min_f <= 0:
        return 1.0
    return max(0.0, min(1.0, candidate_years / exp_min_f))


def _score_education(job: dict, profile: dict):
    """
    Blends department fit (free-text, so matched via token overlap -
    profile.department is a free-text field the user typed, like
    "AI & DS", not a fixed enum) with a second, user_type-dependent
    fit component:

      - Student (or user_type unset/legacy - preserves the original
        behavior exactly for accounts that predate the Student/Job
        Seeker selection): CGPA fit against the job's minimum, if any.
      - Job Seeker: experience fit against the job's experience_min/
        max range instead - CGPA isn't a meaningful signal for an
        experienced professional, per the personalization spec.

    Weights (0.6 department / 0.4 second component) are unchanged from
    before this became user_type-aware.
    """
    preferred_departments = job.get("preferred_departments") or []
    department = profile.get("department") or ""

    if not preferred_departments:
        dept_component = 1.0
    else:
        dept_component = 0.0
        for preferred in preferred_departments:
            if _normalize(department) == _normalize(preferred):
                dept_component = 1.0
                break
            dept_component = max(dept_component, _jaccard(department, preferred))

    if profile.get("user_type") == "Job Seeker":
        second_component = _score_experience_fit(job, profile)
    else:
        second_component = _score_cgpa_fit(job, profile)

    return (0.6 * dept_component) + (0.4 * second_component)


def _score_projects(job: dict, resume_data: dict):
    """
    Uses resume_data.projects (jsonb) when it has been populated for
    this user. This table/column already exists for exactly this
    purpose, but nothing in the current app writes to it yet - so for
    most users this factor is unavailable today, and its weight is
    redistributed proportionally by compute_match rather than guessed.
    Handles both a list of project objects ({name, description,
    skills/technologies}) and a plain list of strings defensively,
    since no writer currently enforces a shape.
    """
    if not resume_data:
        return None

    projects = resume_data.get("projects") or []
    if not projects:
        return None

    count_fraction = min(len(projects), 3) / 3

    required = {str(s).lower() for s in (job.get("required_skills") or [])}
    if not required:
        return count_fraction

    mentioned = set()
    for project in projects:
        if isinstance(project, str):
            text = project
        elif isinstance(project, dict):
            text_parts = [
                str(project.get("name", "")),
                str(project.get("description", "")),
            ]
            tags = project.get("skills") or project.get("technologies") or []
            if isinstance(tags, list):
                text_parts.extend(str(t) for t in tags)
            text = " ".join(text_parts)
        else:
            text = str(project)

        text_lower = text.lower()
        for skill in required:
            if skill in text_lower:
                mentioned.add(skill)

    overlap_fraction = len(mentioned) / len(required)

    return (0.5 * count_fraction) + (0.5 * overlap_fraction)


# ------------------------------------------------------------------
# Public API
# ------------------------------------------------------------------

def compute_match_fingerprint(profile: dict, skill_analysis: dict, career_analysis: dict, resume_data: dict) -> str:
    """
    A stable fingerprint of every input the matching engine reads.
    Used to detect when a cached Gemini explanation
    (job_match_explanations) has gone stale because the user's
    Profile / Skill Analysis / Career Intelligence / Resume Data
    changed - without needing to compare full match scores.
    """
    payload = {
        "skill_levels": profile.get("skill_levels") or {},
        "skills": profile.get("skills") or [],
        "department": profile.get("department"),
        "degree": profile.get("degree"),
        "cgpa": profile.get("cgpa"),
        "user_type": profile.get("user_type"),
        "experience_years": profile.get("experience_years"),
        "career_goal": profile.get("career_goal"),
        "skill_analysis": skill_analysis or {},
        "career_analysis": career_analysis or {},
        "projects": (resume_data or {}).get("projects") or [],
    }
    canonical = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def compute_match(job: dict, profile: dict, skill_analysis: dict, career_analysis: dict, resume_data: dict) -> dict:
    """
    Computes one job's AI Match % against a user, purely
    deterministically. Any factor with no underlying data (most
    commonly Projects) is dropped and its weight is redistributed
    proportionally across the remaining factors, so the final
    percentage always reflects real signal - never a placeholder or
    fabricated value.
    """
    skills_fraction, matched_skills, missing_skills = _score_skills(job, profile)
    career_fraction = _score_career(job, career_analysis)
    education_fraction = _score_education(job, profile)
    projects_fraction = _score_projects(job, resume_data)

    raw = {
        "skills": skills_fraction,
        "career": career_fraction,
        "education": education_fraction,
        "projects": projects_fraction,
    }

    available = {k: v for k, v in raw.items() if v is not None}

    if not available:
        match_percentage = 0
    else:
        total_weight = sum(WEIGHTS[k] for k in available)
        weighted_sum = sum((WEIGHTS[k] / total_weight) * available[k] for k in available)
        match_percentage = round(weighted_sum * 100)

    match_percentage = max(0, min(100, match_percentage))

    score_breakdown = {
        "skills": round(skills_fraction * 100) if skills_fraction is not None else None,
        "career": round(career_fraction * 100) if career_fraction is not None else None,
        "education": round(education_fraction * 100) if education_fraction is not None else None,
        "projects": round(projects_fraction * 100) if projects_fraction is not None else None,
    }

    return {
        "job_id": job["id"],
        "match_percentage": match_percentage,
        "score_breakdown": score_breakdown,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
    }


def score_jobs(jobs: list, profile: dict, skill_analysis: dict, career_analysis: dict, resume_data: dict) -> list:
    """Scores every job in the given list. Used by the search/filter endpoint."""
    results = []
    for job in jobs:
        match = compute_match(job, profile, skill_analysis, career_analysis, resume_data)
        results.append({**job, **match})
    return results


def get_top_matches(
    jobs: list,
    profile: dict,
    skill_analysis: dict,
    career_analysis: dict,
    resume_data: dict,
    limit: int = 3,
) -> list:
    """
    Scores every active job and returns the top N as lightweight match
    records (job_id + score only). Full job details are joined back in
    by the route at read time, so an edit to a live Job Master listing
    is reflected immediately without needing to rerun matching.
    """
    scored = [
        compute_match(job, profile, skill_analysis, career_analysis, resume_data)
        for job in jobs
    ]
    scored.sort(key=lambda m: m["match_percentage"], reverse=True)
    return scored[:limit]