import json
from datetime import datetime, timezone

from app.database.db import supabase
from app.ai.gemini import generate_json
from app.ai.prompts import certificate_recommendation_prompt
from app.services.job_matching_service import compute_match_fingerprint

# ---------------------------------------------------------------------
# Recommended Certifications (Section 3 of the Certificates page).
#
# Gemini is called ONLY when there is no prior recommendation set for
# this email, OR when a fingerprint of everything the recommendation
# depends on (Profile / Skill Analysis / Career Intelligence / Resume
# Data) has changed since the last time it was generated - see
# get_or_generate_recommendations below. compute_match_fingerprint is
# the exact same hashing utility Job Recommendations already uses to
# detect staleness (job_match_explanations) - reused here rather than
# reimplemented, so "what counts as a career-profile change" has one
# single definition across the whole app.
#
# The fingerprint check itself is cheap (a handful of already-indexed
# selects + a hash comparison) and runs on every GET, matching the
# product requirement that opening the Certificates page never
# triggers a Gemini call on its own - only a genuine change does.
# ---------------------------------------------------------------------

VALID_PROVIDERS = {
    "Google", "Microsoft Learn", "AWS", "Oracle", "IBM", "Cisco",
    "Coursera", "MongoDB University", "Meta", "TensorFlow",
    "DeepLearning.AI", "Python Institute", "Hugging Face", "Udemy", "NPTEL",
}

# Official domain allowlist per provider - used to double-check
# Gemini's official_link before it's ever shown to the user, so the
# "Start Course" button can never open an unofficial/reseller site.
PROVIDER_DOMAINS = {
    "Google": ("cloud.google.com", "grow.google", "developers.google.com"),
    "Microsoft Learn": ("learn.microsoft.com",),
    "AWS": ("aws.amazon.com",),
    "Oracle": ("education.oracle.com",),
    "IBM": ("skillsbuild.org", "ibm.com"),
    "Cisco": ("netacad.com", "cisco.com"),
    "Coursera": ("coursera.org",),
    "MongoDB University": ("university.mongodb.com", "learn.mongodb.com", "mongodb.com"),
    "Meta": ("developers.facebook.com", "atmeta.com", "coursera.org"),
    "TensorFlow": ("tensorflow.org",),
    "DeepLearning.AI": ("deeplearning.ai",),
    "Python Institute": ("pythoninstitute.org",),
    "Hugging Face": ("huggingface.co",),
    "Udemy": ("udemy.com",),
    "NPTEL": ("nptel.ac.in",),
}

# Fallback official homepage per provider, used only if Gemini's
# official_link doesn't land on that provider's own domain above.
PROVIDER_FALLBACK_LINK = {
    "Google": "https://cloud.google.com/certification",
    "Microsoft Learn": "https://learn.microsoft.com/en-us/credentials/",
    "AWS": "https://aws.amazon.com/certification/",
    "Oracle": "https://education.oracle.com/certification",
    "IBM": "https://www.ibm.com/training/certification",
    "Cisco": "https://www.netacad.com/",
    "Coursera": "https://www.coursera.org/",
    "MongoDB University": "https://learn.mongodb.com/",
    "Meta": "https://www.coursera.org/professional-certificates/meta-front-end-developer",
    "TensorFlow": "https://www.tensorflow.org/certificate",
    "DeepLearning.AI": "https://www.deeplearning.ai/courses/",
    "Python Institute": "https://pythoninstitute.org/certification",
    "Hugging Face": "https://huggingface.co/learn",
    "Udemy": "https://www.udemy.com/",
    "NPTEL": "https://nptel.ac.in/",
}


def _safe_official_link(provider: str, url: str) -> str:
    domains = PROVIDER_DOMAINS.get(provider)
    if domains and url and any(domain in url for domain in domains):
        return url
    return PROVIDER_FALLBACK_LINK.get(provider, url or "")


def _load_json_field(value, default):
    """Profile columns like career_goal/skills are sometimes stored as
    JSON-encoded strings (see routes/profile.py) - decode defensively
    without ever crashing the recommendation flow over a malformed
    value."""
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:
            return default
    return value if value is not None else default


def _gather_profile_context(email: str):
    """
    Returns (context_dict, missing_reason, fingerprint_inputs).
    context_dict is None (with a human-readable missing_reason) unless
    BOTH Resume Analysis and Skill Analysis have already completed for
    this email, exactly as the spec requires before a Gemini call is
    ever allowed to run. fingerprint_inputs is always returned (even
    when context_dict is None) as the raw (profile, skill_analysis,
    career_analysis, resume_data) tuple compute_match_fingerprint
    expects - callers that only need to check staleness (not generate)
    can use it without a second round of queries.
    """
    resume_analysis = (
        supabase.table("resume_analysis").select("*").eq("email", email).maybe_single().execute()
    )
    skill_analysis = (
        supabase.table("skill_analysis").select("*").eq("email", email).maybe_single().execute()
    )

    resume_row = resume_analysis.data if resume_analysis and resume_analysis.data else None
    skill_row = skill_analysis.data if skill_analysis and skill_analysis.data else None

    resume_data = (
        supabase.table("resume_data").select("*").eq("email", email).maybe_single().execute()
    )
    career_analysis = (
        supabase.table("career_analysis").select("*").eq("email", email).maybe_single().execute()
    )
    profile = (
        supabase.table("profiles").select("*").eq("email", email).maybe_single().execute()
    )

    resume_data_row = resume_data.data if resume_data and resume_data.data else {}
    career_row = (career_analysis.data if career_analysis and career_analysis.data else {}).get("analysis") or {}
    profile_row = profile.data if profile and profile.data else {}

    fingerprint_inputs = (
        profile_row,
        (skill_row or {}).get("analysis") or {},
        career_row,
        resume_data_row,
    )

    if not resume_row or not skill_row:
        return None, (
            "Complete Resume Analysis and Skill Analysis to unlock "
            "AI-powered certification recommendations."
        ), fingerprint_inputs

    skill_payload = (skill_row or {}).get("analysis") or {}
    if not isinstance(skill_payload, dict):
        skill_payload = {}

    context = {
        "resume_skills": _load_json_field(resume_data_row.get("skills"), []),
        "missing_skills": resume_row.get("missing_skills") or [],
        "weak_skills": skill_payload.get("weak_skills", []),
        "important_skills": skill_payload.get("important_skills", []),
        "technical_skills": skill_payload.get("technical_skills", []),
        "career_goal": _load_json_field(profile_row.get("career_goal"), []),
        "recommended_role": career_row.get("recommended_role", ""),
        "education": {
            "degree": profile_row.get("degree", ""),
            "department": profile_row.get("department", ""),
            "college": profile_row.get("college", ""),
            "year": profile_row.get("year", ""),
        },
    }
    return context, None, fingerprint_inputs


def _read_recommendations(email: str) -> dict:
    recs_response = (
        supabase.table("certificate_recommendations")
        .select("*")
        .eq("email", email)
        .order("created_at")
        .execute()
    )
    recommendations = recs_response.data or []

    progress_response = (
        supabase.table("certificate_progress")
        .select("*")
        .eq("email", email)
        .execute()
    )
    progress_by_id = {
        row["recommendation_id"]: row["progress_percent"]
        for row in (progress_response.data or [])
    }

    for rec in recommendations:
        rec["progress_percent"] = progress_by_id.get(rec["id"], 0)

    return {"ready": True, "message": None, "recommendations": recommendations}


def reset_for_new_resume(email: str) -> None:
    """
    Called from Settings > Replace Resume (see routes/settings.py).

    Recommendations are normally generated exactly once per email,
    ever (see get_or_generate_recommendations below) - by design, so a
    page revisit never triggers a second paid Gemini call. Replacing
    the resume is the one deliberate exception the product spec calls
    out: the student's underlying resume has genuinely changed, so the
    Top-5 should be allowed to regenerate once against the new resume
    the next time recommendations are read.

    Deletes any in-progress recommendations/progress and clears the
    "already generated" marker so get_or_generate_recommendations runs
    its one-time Gemini call again on next read. certificate_progress
    rows also cascade automatically via their FK
    (ON DELETE CASCADE - see create_certificates_module_tables.sql),
    the explicit delete here is just defensive. Already-completed
    certificates in user_certificates are untouched - those are the
    student's earned history, not pending recommendations.
    """
    supabase.table("certificate_progress").delete().eq("email", email).execute()
    supabase.table("certificate_recommendations").delete().eq("email", email).execute()
    supabase.table("certificate_recommendation_status").delete().eq("email", email).execute()


def get_or_generate_recommendations(email: str) -> dict:
    """
    Reads the persisted Top-5 recommendations for this email. Makes a
    Gemini call - and only then - when either:

      (a) recommendations have never been generated for this email, or
      (b) they have, but compute_match_fingerprint of the student's
          current Profile/Skill Analysis/Career Intelligence/Resume
          Data no longer matches the fingerprint stored at the time
          they were last generated - i.e. something the recommendation
          genuinely depends on has actually changed, not just "some
          page got visited."

    Prerequisites (Resume Analysis + Skill Analysis) are still
    required before the very first generation can happen, same as
    before.
    """
    context, missing_reason, fingerprint_inputs = _gather_profile_context(email)

    status = (
        supabase.table("certificate_recommendation_status")
        .select("email, match_inputs_fingerprint")
        .eq("email", email)
        .maybe_single()
        .execute()
    )
    already_generated = bool(status and status.data)

    current_fingerprint = compute_match_fingerprint(*fingerprint_inputs) if context is not None else None
    stored_fingerprint = (status.data or {}).get("match_inputs_fingerprint") if already_generated else None

    is_stale = (
        already_generated
        and context is not None
        and stored_fingerprint is not None
        and stored_fingerprint != current_fingerprint
    )

    needs_generation = (not already_generated) or is_stale

    if needs_generation:
        if context is None:
            # Never generated yet, and prerequisites still aren't
            # done - nothing to regenerate either way.
            return {"ready": False, "message": missing_reason, "recommendations": []}

        if is_stale:
            # The student's career-relevant data has genuinely
            # changed since the last generation - clear the old Top-5
            # (and their progress) before replacing them, exactly like
            # reset_for_new_resume already does for a resume swap.
            # This is NOT triggered just because the page was opened.
            supabase.table("certificate_progress").delete().eq("email", email).execute()
            supabase.table("certificate_recommendations").delete().eq("email", email).execute()

        prompt = certificate_recommendation_prompt(context)
        result = generate_json(prompt)
        raw_recommendations = (result.get("recommendations") or [])[:5]

        for rec in raw_recommendations:
            provider = (rec.get("provider") or "").strip()
            if provider not in VALID_PROVIDERS:
                provider = provider or "Coursera"

            row = {
                "email": email,
                "certificate_name": rec.get("certificate_name") or "Untitled Certificate",
                "provider": provider,
                "category": rec.get("category") or "General",
                "difficulty": rec.get("difficulty") or "Intermediate",
                "estimated_duration": rec.get("estimated_duration") or "4-6 Weeks",
                "description": rec.get("description") or "",
                "skills_learned": rec.get("skills_learned") or [],
                "career_benefits": rec.get("career_benefits") or [],
                "prerequisites": rec.get("prerequisites") or [],
                "official_link": _safe_official_link(provider, rec.get("official_link") or ""),
            }

            inserted = supabase.table("certificate_recommendations").insert(row).execute()
            new_id = inserted.data[0]["id"]

            supabase.table("certificate_progress").insert(
                {
                    "recommendation_id": new_id,
                    "email": email,
                    "progress_percent": 0,
                }
            ).execute()

        # Marked as generated regardless of how many rows came back, so
        # even a partial/odd Gemini response can never trigger a retry
        # (and therefore another paid call) on a later page load -
        # only a genuine future fingerprint change will.
        supabase.table("certificate_recommendation_status").upsert(
            {
                "email": email,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "match_inputs_fingerprint": current_fingerprint,
            },
            on_conflict="email",
        ).execute()

    return _read_recommendations(email)
