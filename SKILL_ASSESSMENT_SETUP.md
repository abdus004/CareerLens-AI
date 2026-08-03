# Skill Assessment Feature — Setup Guide

This document covers the one-time setup steps needed to bring the new
Skill Assessment + Certificates feature online. It does not change or
require re-setup of anything else in the project (auth, resumes, mock
interview, placement drives all continue to work unmodified).

## 1. Run the database migration

In the Supabase SQL editor (or via the CLI), run:

```
backend/migrations/create_skill_assessment_tables.sql
```

This creates five new tables — `assessment_question_bank`,
`assessments`, `assessment_answers`, `assessment_results`, and
`certificates` — with the same FK/constraint conventions the existing
`create_mock_interview_tables.sql` migration already uses. It does not
touch any existing table.

## 2. Create the `certificates` Storage bucket

In Supabase → Storage → **New bucket**:

- Name: `certificates`
- Public bucket: **on**

This mirrors the existing `resumes` bucket used by `resume.py` — same
public-bucket pattern, just a new bucket name for certificate PDFs.

## 3. Install the one new backend dependency

`reportlab` (for deterministic, Gemini-free certificate PDF
generation) has been added to `backend/requirements.txt`. Install it
along with the rest:

```
cd backend
pip install -r requirements.txt
```

Everything else the feature uses (`supabase`, `google-genai`, `fastapi`,
etc.) was already a dependency.

## 4. Seed the question bank (840 questions)

Run once, after the migration above:

```
cd backend
python -m scripts.seed_assessment_question_bank
```

This is safe to re-run — like the existing mock-interview seed script,
it checks each `(category, difficulty)` bucket before inserting and
skips any bucket that already has rows, so re-running never creates
duplicates.

It automatically verifies the final counts and prints a report. To
re-check counts at any time without re-seeding:

```
python -m scripts.seed_assessment_question_bank --verify
```

Expected output: every one of the 7 categories × 3 difficulties has
exactly 40 questions, for 840 total —

```
Programming = 120   (Easy 40 / Medium 40 / Hard 40)
Aptitude    = 120   (Easy 40 / Medium 40 / Hard 40)
Reasoning   = 120   (Easy 40 / Medium 40 / Hard 40)
SQL         = 120   (Easy 40 / Medium 40 / Hard 40)
Python      = 120   (Easy 40 / Medium 40 / Hard 40)
Java        = 120   (Easy 40 / Medium 40 / Hard 40)
AI/ML       = 120   (Easy 40 / Medium 40 / Hard 40)
-------------------------------------------------
TOTAL       = 840
```

## 5. Frontend

No new environment variables or dependencies are needed on the
frontend — the new pages (`Assessments.jsx`, `AssessmentTest.jsx`,
`AssessmentResult.jsx`, `Certificates.jsx`) reuse the existing
`api.js` service, `DashboardLayout`, `Sidebar` (its "Assessments" and
"Certificates" nav items already pointed at `/assessments` and
`/certificates` — those routes just didn't exist yet, and now do), and
`lucide-react` icons already in `package.json`.

Just run the frontend as usual:

```
cd frontend
npm install
npm run dev
```

## What you get end-to-end

1. `/assessments` — pick one of 7 categories, choose difficulty (Easy
   / Medium / Hard) and question count (10 / 15 / 20), see the
   computed test duration, and start.
2. `/assessments/test/:id` — timed MCQ test with a question navigator,
   Skip / Save & Next, and a backend-seeded countdown that auto-submits
   at zero.
3. Backend scores deterministically (no AI involved), then makes
   **exactly one** Gemini call for strengths / weak areas /
   recommendations — if that call fails, the score still stands.
4. `/assessments/result/:id` — score, pass/fail (≥80%), topic
   breakdown, AI feedback, a "Review Answers" panel, and — only if
   passed — a **Download Certificate** button.
5. `/certificates` — every certificate you've earned, each with its
   own downloadable PDF.

Every correct-answer / explanation value stays server-side until a
student actually submits that specific attempt (`GET
/skill-assessment/{id}/review` 403s until `status == "completed"`),
and certificate eligibility is re-verified from the stored
`assessment_results` row server-side — never trusted from the client.
