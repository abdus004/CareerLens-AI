from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict
import json
import traceback
from app.routes.career import generate_career_analysis
from app.database.db import supabase
from app.ai.gemini import generate_json
from app.ai.prompts import skill_analysis_prompt
from app.services.certificate_bonus_service import get_certificate_bonus, apply_bonus
from app.services.skill_unification_service import is_soft_skill, normalize_skill_name
from app.services.notification_service import create_notification
from app.data.role_skills import find_role_key_skills
from app.utils.security import get_authenticated_email, require_self

router = APIRouter(
    prefix="/skills",
    tags=["Skills"]
)


class SkillLevelsUpdate(BaseModel):
    skill_levels: Dict[str, int]


@router.put("/{email}")
def update_skill_levels(
    email: str,
    request: SkillLevelsUpdate,
    auth_email: str = Depends(get_authenticated_email),
):
    """
    Saves manually edited skill levels ONLY.

    This intentionally does NOT call Gemini and does NOT regenerate
    Career Intelligence or the Learning Path. That side effect used to
    live here (bundled into a tuple expression that Python evaluates
    eagerly), which meant a simple "save this slider value" click
    silently depended on a slow, external AI call - if that call failed
    for any reason, this whole request returned a 500 even though the
    skill_levels write itself had already succeeded, and the frontend
    was left stuck in editing mode with no way to recover without a
    page refresh. Regeneration now happens explicitly in
    POST /skills/analyze/{email} (Reanalyze), which is where the user
    is actually asking for it to happen.
    """
    require_self(email, auth_email)

    try:

        # Check if profile exists
        response = (
            supabase
            .table("profiles")
            .select("email")
            .eq("email", email)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Profile not found."
            )

        # Save edited skill levels - and only this.
        supabase.table("profiles").update(
            {
                "skill_levels": request.skill_levels
            }
        ).eq("email", email).execute()

        return {
            "success": True,
            "message": "Skill levels updated successfully.",
            "skill_levels": request.skill_levels
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


def _strip_soft_skills(entries):
    """Defense in depth: skill_analysis_prompt already asks Gemini to
    keep soft skills out of technical_skills/important_skills (they
    have their own separate `soft_skills` field), but nothing enforces
    that on an ungoverned LLM response - so this is a second, cheap
    guarantee that generic soft skills (Communication, Teamwork, ...)
    never surface as a technical skill card, percentage, or radar
    point, regardless of what Gemini returned."""
    cleaned = []
    for entry in (entries or []):
        name = entry.get("skill") if isinstance(entry, dict) else entry
        if is_soft_skill(name):
            continue
        cleaned.append(entry)
    return cleaned


def _compute_radar_skills(recommended_role: str, skill_levels: dict):
    """
    Deterministically picks the TOP 5 technical skills for the user's
    actual top career match (recommended_role, from the career_analysis
    just generated/reused above - the single source of truth for "top
    career" shared with Learning Path / Jobs / Drives / Certificates),
    then scores each against the user's REAL, just-saved skill_levels.

    A skill the user doesn't have yet still appears (score 0) rather
    than being silently dropped, so the radar honestly communicates
    the gap instead of only ever showing skills already possessed.

    Falls back to the user's own top-scored technical skills (never a
    fixed list) when recommended_role doesn't match anything in the
    role_skills lookup, so the radar still stays personalized.
    """
    lookup = {normalize_skill_name(k).lower(): v for k, v in (skill_levels or {}).items()}

    target_skills = find_role_key_skills(recommended_role)

    if not target_skills:
        ranked = sorted(
            (skill_levels or {}).items(), key=lambda item: item[1], reverse=True
        )
        target_skills = [normalize_skill_name(name) for name, _ in ranked[:5]]

    radar = []
    seen = set()
    for skill in target_skills[:5]:
        canonical = normalize_skill_name(skill)
        key = canonical.lower()
        if key in seen:
            continue
        seen.add(key)
        radar.append({"skill": canonical, "score": lookup.get(key, 0)})

    return radar


def run_skill_analysis(email: str):
    """
    The actual Reanalyze logic. Split out from the route below so it
    can still be called directly as a plain Python function from
    routes/settings.py's Replace Resume cascade (which is already
    protected by its own session auth check before it ever reaches
    this point) without needing a request-scoped auth dependency.
    """

    try:

        # Fetch profile.
        # maybe_single() returns data=None for zero matches instead of
        # raising, so the 404 branch below is reliably reachable instead
        # of a "profile not found" case surfacing as an opaque 500.
        response = (
            supabase
            .table("profiles")
            .select("*")
            .eq("email", email)
            .maybe_single()
            .execute()
        )

        if not response or not response.data:
            raise HTTPException(
                status_code=404,
                detail="Profile not found."
            )

        profile = response.data

        # Convert JSON strings back into Python objects
        for field in [
            "career_goal", "interests", "skills",
            "projects", "internships", "certifications",
        ]:
            if profile.get(field):
                try:
                    profile[field] = json.loads(profile[field])
                except Exception:
                    pass

        # Generate AI Skill Analysis
        prompt = skill_analysis_prompt(profile)
        result = generate_json(prompt)

        # Defense in depth against soft skills leaking into the
        # TECHNICAL skill set - see _strip_soft_skills above.
        result["technical_skills"] = _strip_soft_skills(result.get("technical_skills"))
        result["important_skills"] = [
            s for s in (result.get("important_skills") or []) if not is_soft_skill(s)
        ]

        # -----------------------------------------
        # Save AI skill scores into profiles table
        # -----------------------------------------
        # Defensive .get() access: Gemini's output has no enforced schema
        # (see ai/gemini.py - no response_mime_type, no validation), so a
        # single call whose technical_skills entries are missing "skill"
        # or "score" used to crash the ENTIRE reanalysis with an
        # uncaught KeyError. That is the main reason Reanalyze appeared
        # to "only work once" - it worked until the AI's output drifted
        # slightly on a later call. Skipping a malformed entry instead
        # of crashing keeps every reanalysis working.

        skill_levels = {}

        for skill in result.get("technical_skills", []):
            skill_name = skill.get("skill")
            skill_score = skill.get("score")
            if skill_name is not None and skill_score is not None:
                skill_levels[skill_name] = skill_score

        supabase.table("profiles").update(
            {
                "skill_levels": skill_levels
            }
        ).eq("email", email).execute()

        # -----------------------------------------
        # Trigger Career Intelligence + Learning Path regeneration
        # BEFORE saving the final Skill Analysis below, and capture its
        # result directly - recommended_role is what decides the radar's
        # 5 skills next, so Radar / Learning Path / Jobs / Drives /
        # Certificates all agree on the same "top career" instead of
        # Skill Analysis silently guessing an independent one via its
        # own Gemini call. Wrapped in its own try/except so a failure
        # here (e.g. the career prompt getting a bad Gemini response)
        # can never take down the Skill Analysis result that was already
        # successfully generated above - the radar just falls back to
        # the user's own top-scored skills in that case (see
        # _compute_radar_skills).
        # -----------------------------------------

        career_result = None
        try:
            career_result = generate_career_analysis(email)
        except Exception:
            traceback.print_exc()

        recommended_role = (career_result or {}).get("recommended_role")
        result["radar_skills"] = _compute_radar_skills(recommended_role, skill_levels)

        # -----------------------------------------
        # Save complete AI analysis (now including radar_skills)
        # -----------------------------------------
        # Real upsert instead of the previous "select, then insert-or-
        # update" pattern. That pattern was not atomic: two
        # near-simultaneous requests (a double click before the button's
        # disabled state re-renders, a retried request, etc.) could each
        # see "no existing row" and both insert - creating two rows for
        # the same email. Once that happened, every future read via
        # .single()/.maybe_single() broke permanently with "multiple
        # rows returned" - this is the other main cause of "Reanalyze
        # only works once". upsert against a UNIQUE(email) constraint
        # makes this safe to call any number of times. Requires the
        # migration SQL provided alongside this file.

        supabase.table("skill_analysis").upsert(
            {
                "email": email,
                "analysis": result
            },
            on_conflict="email"
        ).execute()

        # Best-effort - see notification_service.py. Fires only once
        # the skill analysis itself has actually been saved above.
        create_notification(
            email=email,
            notif_type="skills",
            title="Skill analysis updated",
            message="Your skills have been refreshed based on your latest resume.",
            link="/skill-analysis",
        )

        return result

    except HTTPException:
        raise

    except Exception as e:

        traceback.print_exc()   # prints the real error in the terminal
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/analyze/{email}")
def analyze_skills(
    email: str,
    auth_email: str = Depends(get_authenticated_email),
):
    require_self(email, auth_email)
    return run_skill_analysis(email)


@router.get("/{email}")
def get_skill_analysis(
    email: str,
    auth_email: str = Depends(get_authenticated_email),
):
    require_self(email, auth_email)

    try:

        response = (
            supabase
            .table("skill_analysis")
            .select("*")
            .eq("email", email)
            .maybe_single()
            .execute()
        )

        if not response or not response.data:
            raise HTTPException(
                status_code=404,
                detail="Skill analysis not found."
            )

        # The stored analysis itself is never modified - a small,
        # deterministic bonus for career-relevant completed
        # certificates is layered on top only in this response. See
        # services/certificate_bonus_service.py.
        analysis = dict(response.data["analysis"] or {})
        bonus_info = get_certificate_bonus(email)
        if bonus_info["bonus"]:
            analysis["overall_score"] = apply_bonus(analysis.get("overall_score"), bonus_info["bonus"])
        analysis["certificate_bonus"] = bonus_info["bonus"]
        analysis["relevant_certificate_count"] = bonus_info["relevant_certificate_count"]

        return analysis

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )