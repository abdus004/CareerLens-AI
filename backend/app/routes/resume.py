from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from app.database.db import supabase
from app.services.resume_parser import extract_text, extract_skills
from app.services.profile_resume_analysis_service import run_profile_resume_analysis
from app.services.skill_unification_service import build_unified_skills
from app.utils.security import get_authenticated_email, require_self

import uuid
import os

router = APIRouter(
    prefix="/resume",
    tags=["Resume"]
)


@router.post("/upload")
async def upload_resume(
    email: str = Form(...),
    file: UploadFile = File(...),
    auth_email: str = Depends(get_authenticated_email),
):
    require_self(email, auth_email)

    temp_path = None

    try:
        filename = f"{uuid.uuid4()}_{file.filename}"

        # Read uploaded file
        file_bytes = await file.read()

        # Save temporarily
        temp_path = f"temp_{filename}"

        with open(temp_path, "wb") as f:
            f.write(file_bytes)

        # Upload to Supabase Storage
        supabase.storage.from_("resumes").upload(
            path=filename,
            file=file_bytes,
            file_options={
                "content-type": file.content_type or "application/pdf"
            }
        )

        # Public URL
        public_url = supabase.storage.from_("resumes").get_public_url(filename)

        # Extract Resume Text
        resume_text = extract_text(temp_path)

        print("\n========== RESUME TEXT ==========\n")
        print(resume_text[:1000])
        print("\n=================================\n")

        # -----------------------------------------------------------
        # Dashboard-facing Resume Analysis (scores, structured resume
        # data, and AI suggestions). This is separate from the
        # standalone Resume Analyzer feature (/resume/analyze), which
        # remains independent and stateless - this one persists so the
        # Dashboard can read it without ever calling Gemini itself.
        # Wrapped defensively: if this fails for any reason, the resume
        # upload itself still succeeds, since it's the actual thing the
        # user is waiting on in Profile Setup.
        #
        # This same AI extraction is also THE resume-skills source
        # (resume_data.skills below) - it already reads "every distinct
        # technical skill actually found in the resume text" (see
        # ai/prompts.py:profile_resume_analysis_prompt), which is
        # materially better than a fixed 30-keyword scan. Re-running a
        # second, separate skill extraction here would just be a worse,
        # divergent duplicate of the same job.
        # -----------------------------------------------------------
        try:
            run_profile_resume_analysis(email, resume_text)
        except Exception as analysis_error:
            print(f"Resume analysis failed (upload still succeeded): {analysis_error}")

        resume_data_resp = (
            supabase
            .table("resume_data")
            .select("skills")
            .eq("email", email)
            .maybe_single()
            .execute()
        )
        resume_skills = (resume_data_resp.data or {}).get("skills") if resume_data_resp else None

        # Defensive fallback only - if AI-based extraction above failed
        # or genuinely found nothing, fall back to the lightweight
        # keyword scanner rather than leaving resume_skills empty.
        if not resume_skills:
            resume_skills = extract_skills(resume_text)

        print("\n========== RESUME SKILLS ==========\n")
        print(resume_skills)
        print("\n====================================\n")

        # Check profile exists
        existing = (
            supabase
            .table("profiles")
            .select("id")
            .eq("email", email)
            .execute()
        )

        if not existing.data:
            raise HTTPException(
                status_code=404,
                detail="Profile not found."
            )

        # Update only the resume file/url here - skills are handled
        # entirely by build_unified_skills() below, which REPLACES
        # (not merges/accumulates) profiles.resume_skills with this
        # new resume's skills, then re-merges them with whatever the
        # user selected in Profile Setup. This is what makes a resume
        # replacement correctly drop skills that only existed on the
        # OLD resume, while keeping profile-selected skills and any
        # skill also present on the new resume.
        supabase.table("profiles").update({
            "resume_url": public_url,
        }).eq("email", email).execute()

        unified = build_unified_skills(email, resume_skills=resume_skills)

        return {
            "success": True,
            "message": "Resume uploaded successfully",
            "resume_url": public_url,
            "skills": unified["unified_skills"],
            "data": [{
                "resume_url": public_url,
                "skills": unified["unified_skills"],
            }],
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

from app.services.resume_parser import extract_text
from app.services.resume_analyzer import analyze_resume
import uuid
import os

@router.post("/analyze")
async def analyze_resume_route(
    file: UploadFile = File(...)
):
    temp_path = None

    try:
        filename = f"{uuid.uuid4()}_{file.filename}"

        file_bytes = await file.read()

        temp_path = f"temp_{filename}"

        with open(temp_path, "wb") as f:
            f.write(file_bytes)

        # Extract text from the resume
        resume_text = extract_text(temp_path)

        # Analyze with Gemini
        analysis = analyze_resume(resume_text)

        return analysis

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)