from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import json
import traceback

from app.database.db import supabase
from app.ai.gemini import generate_json
from app.ai.prompts import job_match_explanation_prompt
from app.services.job_matching_service import (
    get_top_matches,
    score_jobs,
    compute_match,
    compute_match_fingerprint,
)

router = APIRouter(
    prefix="/jobs",
    tags=["Job Recommendations"]
)


# ------------------------------------------------------------------
# Shared helpers
# ------------------------------------------------------------------

def _parse_profile(profile: dict) -> dict:
    """
    Same JSON-string-to-list unpacking already used by
    dashboard.py / skills.py / career.py - career_goal, interests and
    skills are stored as JSON-encoded text columns, not native jsonb.
    """
    for field in ["career_goal", "interests", "skills"]:
        if profile.get(field):
            try:
                profile[field] = json.loads(profile[field])
            except Exception:
                pass
    return profile


def _load_user_context(email: str):
    """
    Loads everything Job Recommendations depends on.

    Per the product spec, Job Recommendations is NOT an independent AI
    module - it explicitly depends on Profile, Skill Analysis and
    Career Intelligence already existing. Those three are therefore
    hard prerequisites here (missing either raises a clear 400, not a
    confusing 500 or a silently empty page). Resume Data (project
    history) is optional context only - if it hasn't been populated,
    the matching engine redistributes its weight instead of blocking
    the whole feature.
    """
    profile_res = (
        supabase
        .table("profiles")
        .select("*")
        .eq("email", email)
        .maybe_single()
        .execute()
    )

    if not profile_res or not profile_res.data:
        raise HTTPException(status_code=404, detail="Profile not found.")

    profile = _parse_profile(profile_res.data)

    skill_res = (
        supabase
        .table("skill_analysis")
        .select("analysis")
        .eq("email", email)
        .maybe_single()
        .execute()
    )

    if not skill_res or not skill_res.data:
        raise HTTPException(
            status_code=400,
            detail="Please complete Skill Analysis before viewing Job Recommendations."
        )

    skill_analysis = skill_res.data["analysis"]

    career_res = (
        supabase
        .table("career_analysis")
        .select("analysis")
        .eq("email", email)
        .maybe_single()
        .execute()
    )

    if not career_res or not career_res.data:
        raise HTTPException(
            status_code=400,
            detail="Please complete Career Intelligence before viewing Job Recommendations."
        )

    career_analysis = career_res.data["analysis"]

    resume_res = (
        supabase
        .table("resume_data")
        .select("projects")
        .eq("email", email)
        .maybe_single()
        .execute()
    )

    resume_data = resume_res.data if (resume_res and resume_res.data) else None

    return profile, skill_analysis, career_analysis, resume_data


def _fetch_active_jobs():
    response = (
        supabase
        .table("jobs")
        .select("*")
        .eq("is_active", True)
        .execute()
    )
    return response.data or []


def _attach_job_details(matches: list) -> list:
    """
    Recommendations are stored as lightweight
    {job_id, match_percentage, score_breakdown, matched_skills,
    missing_skills} records. Job details (company, salary, location,
    logo, etc) always come fresh from the Job Master table at read
    time, so editing a live job posting is reflected immediately
    without needing to rerun matching.
    """
    if not matches:
        return []

    job_ids = [m["job_id"] for m in matches]

    jobs_res = (
        supabase
        .table("jobs")
        .select("*")
        .in_("id", job_ids)
        .execute()
    )

    jobs_by_id = {job["id"]: job for job in (jobs_res.data or [])}

    enriched = []
    for match in matches:
        job = jobs_by_id.get(match["job_id"])
        if not job:
            # Job was deleted/deactivated from the Job Master since this
            # recommendation was generated - skip it rather than show a
            # broken card. It will be replaced next time Reanalyze runs.
            continue
        enriched.append({**job, **match})

    return enriched



# Job Recommendations shows "Top Recommended Jobs" - target 6-10,
# capped at 10 even when the active Job Master database is much
# larger than that (see JOB_RECOMMENDATIONS_LIMIT below).
JOB_RECOMMENDATIONS_LIMIT = 10


def _generate_and_save_recommendations(email: str):
    """
    The actual "Reanalyze" logic: recomputes match scores and rankings
    from whatever is currently stored in Profile, Skill Analysis,
    Career Intelligence and Resume Data. Scoring is fully deterministic
    (job_matching_service.py), so identical inputs always produce an
    identical Top N - rankings only move when the user's underlying
    data has genuinely changed.

    Shows up to JOB_RECOMMENDATIONS_LIMIT (10) jobs - as many as exist
    if the active Job Master database has fewer than that. total_matching
    is the size of the full active pool these were ranked against
    (surfaced by the frontend as "Showing X of Y matching jobs") - both
    X and Y are always read straight from the database/query results,
    never hardcoded.
    """
    profile, skill_analysis, career_analysis, resume_data = _load_user_context(email)

    jobs = _fetch_active_jobs()
    if not jobs:
        raise HTTPException(
            status_code=404,
            detail="No active jobs available in the Job Master database yet."
        )

    top_matches = get_top_matches(
        jobs, profile, skill_analysis, career_analysis, resume_data,
        limit=JOB_RECOMMENDATIONS_LIMIT,
    )
    total_matching = len(jobs)

    fingerprint = compute_match_fingerprint(
        profile, skill_analysis, career_analysis, resume_data
    )

    # Real upsert against the UNIQUE(email) primary key - same fix
    # already applied to skill_analysis, avoiding the "two rows for the
    # same email" race condition that a select-then-insert-or-update
    # pattern is vulnerable to.
    supabase.table("job_recommendations").upsert(
        {
            "email": email,
            "recommendations": top_matches,
            "match_inputs_fingerprint": fingerprint,
            "total_matching": total_matching,
        },
        on_conflict="email"
    ).execute()

    return _attach_job_details(top_matches), total_matching


# ------------------------------------------------------------------
# Routes
# ------------------------------------------------------------------

@router.get("/{email}")
def get_job_recommendations(email: str):
    """
    Loads the user's saved Top 3 job recommendations. Returns 404 if
    none have been generated yet - the frontend auto-generates one the
    first time, the same pattern already used by
    GET /career/{email} and GET /skills/{email}.
    """
    try:
        response = (
            supabase
            .table("job_recommendations")
            .select("*")
            .eq("email", email)
            .maybe_single()
            .execute()
        )

        if not response or not response.data:
            raise HTTPException(status_code=404, detail="Job recommendations not found.")

        return {
            "recommendations": _attach_job_details(response.data["recommendations"]),
            "updated_at": response.data["updated_at"],
            # .get() with a default: rows saved before the total_matching
            # column existed simply read back as 0 instead of erroring.
            "total_matching": response.data.get("total_matching", 0),
        }

    except HTTPException:
        raise

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/{email}")
def analyze_jobs(email: str):
    """
    "Reanalyze". Explicit, user-requested recomputation of AI Match
    scores and rankings against the Job Master database. Does not call
    Gemini for ranking/matching/filtering - see job_matching_service.py.
    """
    try:
        recommendations, total_matching = _generate_and_save_recommendations(email)
        return {"recommendations": recommendations, "total_matching": total_matching}

    except HTTPException:
        raise

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{email}/search")
def search_jobs(
    email: str,
    q: Optional[str] = Query(None, description="Search company name or role title"),
    location: Optional[str] = Query(None),
    min_salary: Optional[float] = Query(None),
    max_experience: Optional[float] = Query(None),
):
    """
    Filters run entirely against the Job Master database - no Gemini
    involved anywhere in this endpoint. Every matching job is annotated
    with the same deterministic AI Match % used for the Top 3, so
    filtered results stay visually consistent with the rest of the page.
    """
    try:
        profile, skill_analysis, career_analysis, resume_data = _load_user_context(email)

        query = supabase.table("jobs").select("*").eq("is_active", True)

        if location:
            query = query.ilike("location", f"%{location}%")

        if min_salary is not None:
            query = query.gte("salary_max", min_salary)

        if max_experience is not None:
            query = query.lte("experience_min", max_experience)

        jobs = query.execute().data or []

        if q:
            q_lower = q.lower()
            jobs = [
                job for job in jobs
                if q_lower in (job.get("company_name") or "").lower()
                or q_lower in (job.get("role_title") or "").lower()
            ]

        scored = score_jobs(jobs, profile, skill_analysis, career_analysis, resume_data)
        scored.sort(key=lambda job: job["match_percentage"], reverse=True)

        return {"jobs": scored}

    except HTTPException:
        raise

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{email}/{job_id}")
def get_job_details(email: str, job_id: str):
    """
    "View Details". Deterministic fields (required/matched/missing
    skills, match %) are always computed fresh. The Gemini-written
    narrative (why this job matches, missing-skill explanation,
    suggested next steps) is cached in job_match_explanations and only
    regenerated when the underlying Profile/Skill Analysis/Career
    Intelligence/Resume Data has actually changed since it was last
    generated - tracked via input_fingerprint, independent of whether
    the user has clicked "Reanalyze" on the Top 3 list.
    """
    try:
        job_res = (
            supabase
            .table("jobs")
            .select("*")
            .eq("id", job_id)
            .maybe_single()
            .execute()
        )

        if not job_res or not job_res.data:
            raise HTTPException(status_code=404, detail="Job not found.")

        job = job_res.data

        profile, skill_analysis, career_analysis, resume_data = _load_user_context(email)

        match = compute_match(job, profile, skill_analysis, career_analysis, resume_data)
        fingerprint = compute_match_fingerprint(
            profile, skill_analysis, career_analysis, resume_data
        )

        cached = (
            supabase
            .table("job_match_explanations")
            .select("*")
            .eq("email", email)
            .eq("job_id", job_id)
            .maybe_single()
            .execute()
        )

        if cached and cached.data and cached.data.get("input_fingerprint") == fingerprint:
            explanation = cached.data["explanation"]
        else:
            prompt = job_match_explanation_prompt(
                profile=profile,
                job=job,
                matched_skills=match["matched_skills"],
                missing_skills=match["missing_skills"],
                match_percentage=match["match_percentage"],
            )

            explanation = generate_json(prompt)

            supabase.table("job_match_explanations").upsert(
                {
                    "email": email,
                    "job_id": job_id,
                    "explanation": explanation,
                    "input_fingerprint": fingerprint,
                },
                on_conflict="email,job_id"
            ).execute()

        return {
            **job,
            **match,
            "explanation": explanation,
        }

    except HTTPException:
        raise

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))