from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict
import json
import traceback
from app.routes.career import generate_career_analysis
from app.database.db import supabase
from app.ai.gemini import generate_json
from app.ai.prompts import skill_analysis_prompt

router = APIRouter(
    prefix="/skills",
    tags=["Skills"]
)


class SkillLevelsUpdate(BaseModel):
    skill_levels: Dict[str, int]


@router.put("/{email}")
def update_skill_levels(email: str, request: SkillLevelsUpdate):
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


@router.post("/analyze/{email}")
def analyze_skills(email: str):

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
        # Save complete AI analysis
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

        # -----------------------------------------
        # Trigger Career Intelligence + Learning Path regeneration.
        # Moved here from PUT /skills/{email} - this is the action the
        # user is actually requesting when they click Reanalyze. Wrapped
        # in its own try/except so a failure here (e.g. the career
        # prompt getting a bad Gemini response) can never take down the
        # Skill Analysis result that was already successfully generated
        # and saved above.
        # -----------------------------------------

        try:
            generate_career_analysis(email)
        except Exception:
            traceback.print_exc()

        return result

    except HTTPException:
        raise

    except Exception as e:

        traceback.print_exc()   # prints the real error in the terminal
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/{email}")
def get_skill_analysis(email: str):

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

        return response.data["analysis"]

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )