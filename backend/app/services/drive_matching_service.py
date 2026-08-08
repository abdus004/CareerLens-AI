"""
Deterministic Top 10 Recommended Placement Drives ranking.

Mirrors job_matching_service.py's design (no Gemini calls, no database
access here - just plain Python data in, a ranking out) but adapted to
what placement_drives actually stores: unlike `jobs`, this table has no
structured required_skills / preferred_departments / min_cgpa columns
(see the schema) - only a free-text `role` and `description`, synced
from Greenhouse/Lever/manual postings. So eligibility/skills/department
fit is scored the same way job_matching_service already scores Career
Alignment: token-overlap between that free text and everything we know
about the student (skills, career goal, department, Career
Intelligence's recommended/top roles).

Deliberately does NOT compute or expose a percentage to the frontend -
the product spec removes match-percentage display for drives entirely.
The numeric score here exists ONLY to rank; nothing about it is ever
serialized back to the client.

Resilient by design: a student with no Skill Analysis / Career
Intelligence yet still gets a sensible ranking (falls back to deadline
urgency only) rather than an error, since - unlike Job Recommendations -
Browse/Recommended Placement Drives has never required those as hard
prerequisites and shouldn't start requiring them now.
"""

import re
from datetime import date, datetime


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


def _student_signal_text(profile: dict, career_analysis: dict) -> str:
    terms = []

    if profile:
        terms.extend(profile.get("skills") or [])
        terms.extend((profile.get("skill_levels") or {}).keys())
        if profile.get("career_goal"):
            goal = profile["career_goal"]
            terms.extend(goal if isinstance(goal, list) else [goal])
        if profile.get("department"):
            terms.append(profile["department"])
        if profile.get("degree"):
            terms.append(profile["degree"])

    if career_analysis:
        if career_analysis.get("recommended_role"):
            terms.append(career_analysis["recommended_role"])
        for candidate in (career_analysis.get("top_roles") or []):
            if candidate.get("role"):
                terms.append(candidate["role"])

    return " ".join(str(t) for t in terms)


def _score_relevance(drive: dict, signal_text: str):
    """Returns None (not 0) when we genuinely have nothing to compare against."""
    if not signal_text.strip():
        return None

    drive_text = f"{drive.get('role', '')} {drive.get('description', '') or ''}"
    if not drive_text.strip():
        return None

    return _jaccard(drive_text, signal_text)


def _score_deadline_urgency(deadline_value):
    """
    Sooner deadlines rank higher. A drive with no deadline (rolling
    applications) gets a fixed mid-range score rather than 0 or 1, so
    it neither dominates nor gets buried purely for lacking a date.
    """
    if not deadline_value:
        return 0.4

    try:
        if isinstance(deadline_value, str):
            deadline = date.fromisoformat(deadline_value[:10])
        elif isinstance(deadline_value, datetime):
            deadline = deadline_value.date()
        elif isinstance(deadline_value, date):
            deadline = deadline_value
        else:
            return 0.4
    except ValueError:
        return 0.4

    days_left = (deadline - date.today()).days

    if days_left < 0:
        return 0.0  # defensive only - expired drives are filtered out before this runs

    # Anything closing within ~3 days scores near 1.0; anything 30+
    # days out flattens to a low-but-nonzero baseline.
    return max(0.1, min(1.0, 1 - (days_left / 30)))


def rank_recommended_drives(
    drives: list,
    profile: dict = None,
    career_analysis: dict = None,
    limit: int = 10,
) -> list:
    """
    Ranks already-filtered (active, non-expired) drives and returns the
    top `limit`. Combines relevance (skills/career-goal/department fit,
    when available) with deadline urgency (always available), so a
    highly relevant drive closing tomorrow outranks an equally relevant
    one closing in a month, per the product spec.
    """
    signal_text = _student_signal_text(profile or {}, career_analysis or {})

    scored = []
    for drive in drives:
        relevance = _score_relevance(drive, signal_text)
        urgency = _score_deadline_urgency(drive.get("deadline"))

        if relevance is None:
            # No student signal yet (new/incomplete profile) - rank by
            # deadline urgency alone instead of guessing relevance.
            combined = urgency
        else:
            combined = (0.65 * relevance) + (0.35 * urgency)

        scored.append((combined, drive))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [drive for _, drive in scored[:limit]]
