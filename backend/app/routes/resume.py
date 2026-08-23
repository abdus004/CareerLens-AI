import logging

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from app.database.db import supabase
from app.services.resume_parser import extract_text, extract_skills
from app.services.profile_resume_analysis_service import run_profile_resume_analysis
from app.services.skill_unification_service import build_unified_skills
from app.utils.security import get_authenticated_email, require_self
from app.utils.storage import delete_storage_object

import uuid
import os

router = APIRouter(
    prefix="/resume",
    tags=["Resume"]
)

logger = logging.getLogger(__name__)

# Matches the file types the frontend's file picker actually advertises
# (accept=".pdf,.doc,.docx" in ResumeUpload.jsx / ResumeAnalyzer.jsx),
# and verified against this project's pinned pymupdf==1.27.1, which can
# extract text from all three. Previously this endpoint accepted ANY
# file type with no check at all, uploaded it straight to a public
# storage bucket, and fed its bytes into the local PDF parser.
ALLOWED_RESUME_CONTENT_TYPES = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}

# Resumes are text documents, not media - 10 MB comfortably covers even
# an image-heavy PDF export while ruling out using this endpoint to
# push arbitrarily large uploads through the server.
MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024


def _validated_extension(file: UploadFile) -> str:
    """
    Raises 400 for any file type outside ALLOWED_RESUME_CONTENT_TYPES;
    otherwise returns the fixed extension for that type. Callers must
    build the storage filename from THIS return value, never from
    file.filename directly - file.filename is fully attacker-controlled
    and was previously concatenated straight into both a local temp
    file path and the Supabase Storage object path with no sanitization
    at all (a path-traversal-shaped filename like "../../x" was never
    rejected or stripped).
    """
    extension = ALLOWED_RESUME_CONTENT_TYPES.get(file.content_type)
    if not extension:
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF or Word document (.pdf, .doc, or .docx).",
        )
    return extension


@router.post("/upload")
async def upload_resume(
    email: str = Form(...),
    file: UploadFile = File(...),
    auth_email: str = Depends(get_authenticated_email),
):
    require_self(email, auth_email)

    extension = _validated_extension(file)

    temp_path = None

    try:
        filename = f"{uuid.uuid4()}.{extension}"

        # Read uploaded file
        file_bytes = await file.read()

        if len(file_bytes) > MAX_RESUME_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail="Resume file is too large. Please upload a file under 10 MB.",
            )

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

        logger.debug("Resume text extracted for %s (%d chars)", email, len(resume_text))

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
            logger.warning("Resume analysis failed for %s (upload still succeeded): %s", email, analysis_error)

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

        logger.debug("Resume skills for %s: %s", email, resume_skills)

        # Check profile exists (also grabs the CURRENT resume_url, if
        # any, so the file it's about to be replaced with can be
        # cleaned up from storage after the new one is safely saved -
        # see delete_storage_object call below).
        existing = (
            supabase
            .table("profiles")
            .select("id, resume_url")
            .eq("email", email)
            .execute()
        )

        if not existing.data:
            raise HTTPException(
                status_code=404,
                detail="Profile not found."
            )

        old_resume_url = existing.data[0].get("resume_url")

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

        # Old file cleaned up only after the new one is safely saved -
        # same ordering as the avatar upload flow in settings.py.
        # Previously the old resume (and its still-public URL) was
        # never removed, so a "replaced" resume stayed reachable
        # forever.
        if old_resume_url and old_resume_url != public_url:
            delete_storage_object("resumes", old_resume_url)

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

    except HTTPException:
        raise

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
    file: UploadFile = File(...),
    # Was previously reachable with no authentication at all - the one
    # Gemini-calling route in the app that didn't require a logged-in
    # user, which meant anyone (no account needed) could hit this
    # endpoint in a loop and run up real Gemini API cost with no rate
    # limiting. Every other AI-calling route already requires this
    # (see support.py's /assistant, certificates.py's /extract) - this
    # brings /resume/analyze in line with that pattern. auth_email
    # itself isn't used below since this endpoint has never been
    # per-user/persisted (see the comment in upload_resume above) -
    # requiring a valid session is the fix, not scoping data by email.
    auth_email: str = Depends(get_authenticated_email),
):
    extension = _validated_extension(file)

    temp_path = None

    try:
        filename = f"{uuid.uuid4()}.{extension}"

        file_bytes = await file.read()

        if len(file_bytes) > MAX_RESUME_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail="Resume file is too large. Please upload a file under 10 MB.",
            )

        temp_path = f"temp_{filename}"

        with open(temp_path, "wb") as f:
            f.write(file_bytes)

        # Extract text from the resume
        resume_text = extract_text(temp_path)

        # Analyze with Gemini
        analysis = analyze_resume(resume_text)

        return analysis

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)