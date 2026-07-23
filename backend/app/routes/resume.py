from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.database.db import supabase
from app.services.resume_parser import extract_text, extract_skills

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