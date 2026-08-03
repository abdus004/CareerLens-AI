import io
import os
import tempfile
import uuid
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from app.database.db import supabase

# ---------------------------------------------------------------------
# Certificate generation for the Skill Assessment feature.
#
# Deliberately has ZERO Gemini calls anywhere in this file (per spec).
# Certificate eligibility and content are derived entirely from the
# already-stored, already-verified assessment_results row - never from
# anything the frontend sends - so a client can't fabricate a passing
# certificate by posting a fake score.
# ---------------------------------------------------------------------

CATEGORY_LABELS = {
    "Programming": "Programming",
    "Aptitude": "Aptitude",
    "Reasoning": "Reasoning",
    "SQL": "SQL",
    "Python": "Python",
    "Java": "Java",
    "AI/ML": "AI / ML",
}


def _generate_certificate_id() -> str:
    return f"CLA-{uuid.uuid4().hex[:8].upper()}"


def _draw_certificate_pdf(student_name: str, category_label: str, difficulty: str, score: float, certificate_id: str, issued_at: datetime) -> bytes:
    """
    Renders a single-page landscape certificate to PDF bytes - styled
    to look like an actual printable certificate (light background,
    gold accents, serif typography, signature line) rather than a dark
    dashboard card. Pure layout code - every value drawn onto the page
    is passed in by the caller, which in turn only ever reads them from
    the database (see generate_certificate below), never from an
    unverified request body.
    """
    buffer = io.BytesIO()
    page_size = landscape(A4)
    width, height = page_size
    pdf = canvas.Canvas(buffer, pagesize=page_size)

    IVORY = colors.HexColor("#FFFDF7")
    NAVY = colors.HexColor("#1B2A4A")
    SLATE = colors.HexColor("#5B6472")
    GOLD = colors.HexColor("#B8912F")

    # Background - light ivory, not dark
    pdf.setFillColor(IVORY)
    pdf.rect(0, 0, width, height, stroke=0, fill=1)

    # Outer gold border
    pdf.setStrokeColor(GOLD)
    pdf.setLineWidth(2.2)
    pdf.rect(12 * mm, 12 * mm, width - 24 * mm, height - 24 * mm, stroke=1, fill=0)

    # Inner thin navy border
    pdf.setStrokeColor(NAVY)
    pdf.setLineWidth(0.6)
    pdf.rect(16 * mm, 16 * mm, width - 32 * mm, height - 32 * mm, stroke=1, fill=0)

    # Small gold diamond accents at each inner corner
    def corner_mark(x, y):
        pdf.saveState()
        pdf.translate(x, y)
        pdf.rotate(45)
        pdf.setFillColor(GOLD)
        size = 2.4 * mm
        pdf.rect(-size / 2, -size / 2, size, size, stroke=0, fill=1)
        pdf.restoreState()

    corner_mark(16 * mm, 16 * mm)
    corner_mark(width - 16 * mm, 16 * mm)
    corner_mark(16 * mm, height - 16 * mm)
    corner_mark(width - 16 * mm, height - 16 * mm)

    center_x = width / 2

    # Brand
    pdf.setFillColor(NAVY)
    pdf.setFont("Helvetica-Bold", 20)
    pdf.drawCentredString(center_x, height - 34 * mm, "CareerLens AI")

    pdf.setFillColor(GOLD)
    pdf.setFont("Helvetica", 9)
    pdf.drawCentredString(center_x, height - 40 * mm, "A I   P O W E R E D   C A R E E R   P L A T F O R M")

    pdf.setStrokeColor(GOLD)
    pdf.setLineWidth(0.9)
    pdf.line(center_x - 28 * mm, height - 44 * mm, center_x + 28 * mm, height - 44 * mm)

    # Title
    pdf.setFillColor(NAVY)
    pdf.setFont("Times-Bold", 32)
    pdf.drawCentredString(center_x, height - 61 * mm, "Certificate of Achievement")

    pdf.setStrokeColor(GOLD)
    pdf.setLineWidth(0.7)
    pdf.line(center_x - 45 * mm, height - 66 * mm, center_x + 45 * mm, height - 66 * mm)

    # Body copy
    pdf.setFillColor(SLATE)
    pdf.setFont("Times-Italic", 13)
    pdf.drawCentredString(center_x, height - 79 * mm, "This is to certify that")

    # Student name, underlined
    pdf.setFillColor(NAVY)
    pdf.setFont("Times-Bold", 27)
    pdf.drawCentredString(center_x, height - 92 * mm, student_name)

    name_width = pdf.stringWidth(student_name, "Times-Bold", 27)
    pdf.setStrokeColor(GOLD)
    pdf.setLineWidth(0.8)
    pdf.line(center_x - name_width / 2 - 6 * mm, height - 96 * mm, center_x + name_width / 2 + 6 * mm, height - 96 * mm)

    # Achievement description
    pdf.setFillColor(SLATE)
    pdf.setFont("Times-Roman", 13)
    pdf.drawCentredString(
        center_x,
        height - 107 * mm,
        f"has successfully completed the {category_label} - {difficulty} Skill Assessment",
    )

    # Score
    pdf.setFillColor(NAVY)
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawCentredString(center_x, height - 121 * mm, f"Final Score: {score:g}%")

    # Footer: Date (left) + Authorized Signature (right), each on a
    # ruled line, with the Certificate ID centered underneath.
    line_y = 40 * mm

    pdf.setStrokeColor(NAVY)
    pdf.setLineWidth(0.6)
    pdf.line(30 * mm, line_y, 85 * mm, line_y)
    pdf.setFillColor(NAVY)
    pdf.setFont("Helvetica", 10)
    pdf.drawCentredString(57.5 * mm, line_y - 5.5 * mm, issued_at.strftime("%d %B %Y"))
    pdf.setFillColor(SLATE)
    pdf.setFont("Helvetica", 8)
    pdf.drawCentredString(57.5 * mm, line_y - 10 * mm, "DATE ISSUED")

    pdf.setStrokeColor(NAVY)
    pdf.line(width - 85 * mm, line_y, width - 30 * mm, line_y)
    pdf.setFillColor(NAVY)
    pdf.setFont("Times-Italic", 15)
    pdf.drawCentredString(width - 57.5 * mm, line_y + 2.5 * mm, "CareerLens AI")
    pdf.setFillColor(SLATE)
    pdf.setFont("Helvetica", 8)
    pdf.drawCentredString(width - 57.5 * mm, line_y - 10 * mm, "AUTHORIZED SIGNATURE")

    pdf.setFillColor(SLATE)
    pdf.setFont("Helvetica", 9)
    pdf.drawCentredString(center_x, 16.5 * mm, f"Certificate ID: {certificate_id}")

    pdf.showPage()
    pdf.save()

    buffer.seek(0)
    return buffer.read()


def _get_student_name(email: str) -> str:
    response = (
        supabase.table("profiles")
        .select("full_name")
        .eq("email", email)
        .maybe_single()
        .execute()
    )
    full_name = (response.data or {}).get("full_name") if response and response.data else None
    return full_name or email


def generate_certificate(assessment_id: str, email: str) -> dict:
    """
    Verifies (server-side, against stored data only) that this
    assessment attempt belongs to this email, is completed, and
    scored >= 80, then either returns the existing certificate for it
    (idempotent - re-clicking Download never creates a duplicate) or
    generates a new one: renders the PDF, uploads it to the
    'certificates' Supabase Storage bucket, and inserts the
    certificates row.

    Raises ValueError for any eligibility failure - the route layer
    turns that into a 400/403/404 as appropriate.
    """
    existing = (
        supabase.table("certificates")
        .select("*")
        .eq("assessment_id", assessment_id)
        .maybe_single()
        .execute()
    )
    if existing and existing.data:
        return existing.data

    assessment_response = (
        supabase.table("assessments")
        .select("*")
        .eq("id", assessment_id)
        .maybe_single()
        .execute()
    )
    if not assessment_response or not assessment_response.data:
        raise ValueError("Assessment not found.")

    assessment = assessment_response.data
    if assessment["email"] != email:
        raise ValueError("This assessment does not belong to this account.")
    if assessment["status"] != "completed":
        raise ValueError("This assessment has not been completed yet.")

    result_response = (
        supabase.table("assessment_results")
        .select("*")
        .eq("assessment_id", assessment_id)
        .maybe_single()
        .execute()
    )
    if not result_response or not result_response.data:
        raise ValueError("This assessment has not been scored yet.")

    result = result_response.data
    if not result["passed"]:
        raise ValueError("A certificate is only issued for a passing score (80% or higher).")

    certificate_id = _generate_certificate_id()
    issued_at = datetime.now(timezone.utc)
    student_name = _get_student_name(email)
    category_label = CATEGORY_LABELS.get(assessment["category"], assessment["category"])

    pdf_bytes = _draw_certificate_pdf(
        student_name=student_name,
        category_label=category_label,
        difficulty=assessment["difficulty"],
        score=float(result["percentage"]),
        certificate_id=certificate_id,
        issued_at=issued_at,
    )

    filename = f"{certificate_id}.pdf"
    supabase.storage.from_("certificates").upload(
        path=filename,
        file=pdf_bytes,
        file_options={"content-type": "application/pdf"},
    )
    pdf_url = supabase.storage.from_("certificates").get_public_url(filename)

    row = {
        "certificate_id": certificate_id,
        "email": email,
        "assessment_id": assessment_id,
        "category": assessment["category"],
        "difficulty": assessment["difficulty"],
        "score": result["percentage"],
        "pdf_url": pdf_url,
        "issued_at": issued_at.isoformat(),
    }

    insert_response = supabase.table("certificates").insert(row).execute()
    return insert_response.data[0]