import uuid
import traceback
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from app.database.db import supabase
from app.ai.gemini import generate_json
from app.ai.prompts import support_assistant_prompt
from app.utils.security import get_authenticated_email, require_self

router = APIRouter(
    prefix="/support",
    tags=["Help & Support"]
)

SUPPORT_ATTACHMENTS_BUCKET = "support-attachments"


# ------------------------------------------------------------------
# CareerLens AI Support Assistant
#
# FAQ is static content and lives entirely in the frontend
# (components/help/FAQSection.jsx) - it needs no backend/Gemini calls.
# ------------------------------------------------------------------

class SupportChatTurn(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class SupportChatRequest(BaseModel):
    message: str
    # Kept only for the current browser session by the frontend and
    # sent back turn-by-turn so the assistant has short-term context -
    # never persisted to Supabase, per the product spec.
    history: List[SupportChatTurn] = []


@router.post("/assistant")
def support_assistant_chat(payload: SupportChatRequest):
    message = (payload.message or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        history = [turn.model_dump() for turn in payload.history]
        prompt = support_assistant_prompt(message, history)
        result = generate_json(prompt)

        reply = (result.get("reply") or "").strip() or (
            "I'm sorry, I couldn't put together an answer for that. "
            "Could you try rephrasing your question?"
        )
        in_scope = bool(result.get("in_scope", True))

        return {"reply": reply, "in_scope": in_scope}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"The support assistant is temporarily unavailable: {e}"
        )


# ------------------------------------------------------------------
# Feedback
# ------------------------------------------------------------------

class FeedbackRequest(BaseModel):
    email: str
    rating: int
    message: str = ""


@router.post("/feedback")
def submit_feedback(
    payload: FeedbackRequest,
    auth_email: str = Depends(get_authenticated_email),
):
    require_self(payload.email, auth_email)

    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5.")

    try:
        inserted = (
            supabase.table("feedback")
            .insert({
                "email": payload.email,
                "rating": payload.rating,
                "message": (payload.message or "").strip() or None,
            })
            .execute()
        )

        return {
            "success": True,
            "message": "Thank you for your feedback!",
            "data": inserted.data[0] if inserted.data else None,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------------
# Contact Support (tickets)
# ------------------------------------------------------------------

VALID_PRIORITIES = {"Low", "Medium", "High"}


def _generate_ticket_reference() -> str:
    year = datetime.now(timezone.utc).year
    prefix = f"CL-{year}-"

    existing = (
        supabase.table("support_tickets")
        .select("ticket_reference")
        .ilike("ticket_reference", f"{prefix}%")
        .execute()
    )
    count = len(existing.data or [])
    return f"{prefix}{str(count + 1).zfill(5)}"


@router.post("/ticket")
async def submit_ticket(
    email: str = Form(...),
    subject: str = Form(...),
    category: str = Form(...),
    priority: str = Form("Medium"),
    message: str = Form(...),
    attachment: Optional[UploadFile] = File(None),
    auth_email: str = Depends(get_authenticated_email),
):
    require_self(email, auth_email)

    if priority not in VALID_PRIORITIES:
        raise HTTPException(status_code=400, detail="priority must be Low, Medium or High.")

    attachment_url = None
    attachment_name = None

    if attachment is not None and attachment.filename:
        file_bytes = await attachment.read()

        ext = ""
        if "." in attachment.filename:
            ext = "." + attachment.filename.rsplit(".", 1)[-1]
        stored_name = f"{uuid.uuid4()}{ext}"

        supabase.storage.from_(SUPPORT_ATTACHMENTS_BUCKET).upload(
            path=stored_name,
            file=file_bytes,
            file_options={
                "content-type": attachment.content_type or "application/octet-stream"
            },
        )
        attachment_url = supabase.storage.from_(SUPPORT_ATTACHMENTS_BUCKET).get_public_url(stored_name)
        attachment_name = attachment.filename

    row = {
        "email": email,
        "subject": subject.strip(),
        "category": category,
        "priority": priority,
        "message": message.strip(),
        "attachment_url": attachment_url,
        "attachment_name": attachment_name,
        "status": "Open",
    }

    # ticket_reference is UNIQUE - retried a couple of times in the
    # unlikely event two tickets are submitted in the same instant and
    # both compute the same "next number" from the same count.
    last_error = None
    for _ in range(3):
        reference = _generate_ticket_reference()
        try:
            inserted = (
                supabase.table("support_tickets")
                .insert({**row, "ticket_reference": reference})
                .execute()
            )
            return {
                "success": True,
                "message": "Support request submitted successfully.",
                "ticket_reference": reference,
                "data": inserted.data[0] if inserted.data else None,
            }
        except Exception as e:
            last_error = e
            error_text = str(e).lower()
            if "duplicate" in error_text or "unique" in error_text:
                continue
            raise HTTPException(status_code=500, detail=str(e))

    raise HTTPException(
        status_code=500,
        detail=f"Could not generate a unique ticket reference: {last_error}"
    )
