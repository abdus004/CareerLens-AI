from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.database.db import supabase
from app.services.resume_parser import extract_text, extract_skills
from app.services.profile_resume_analysis_service import run_profile_resume_analysis

import uuid
import os
import json

router = APIRouter(
    prefix="/resume",
    tags=["Resume"]
)


@router.post("/upload")
async def upload_resume(
    email: str = Form(...),
    file: UploadFile = File(...)
):

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

        # Extract Skills
        skills = extract_skills(resume_text)

        print("\n========== SKILLS ==========\n")
        print(skills)
        print("\n============================\n")

        # -----------------------------------------------------------
        # Dashboard-facing Resume Analysis (scores, structured resume
        # data, and AI suggestions). This is separate from the
        # standalone Resume Analyzer feature (/resume/analyze), which
        # remains independent and stateless - this one persists so the
        # Dashboard can read it without ever calling Gemini itself.
        # Wrapped defensively: if this fails for any reason, the resume
        # upload itself still succeeds, since it's the actual thing the
        # user is waiting on in Profile Setup.
        # -----------------------------------------------------------
        try:
            run_profile_resume_analysis(email, resume_text)
        except Exception as analysis_error:
            print(f"Resume analysis failed (upload still succeeded): {analysis_error}")

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

        # Update only resume fields
        response = (
            supabase
            .table("profiles")
            .update({
                "resume_url": public_url,
                "skills": json.dumps(skills)
            })
            .eq("email", email)
            .execute()
        )

        return {
            "success": True,
            "message": "Resume uploaded successfully",
            "resume_url": public_url,
            "skills": skills,
            "data": response.data
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