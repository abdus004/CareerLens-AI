-- =====================================================================
-- Migration: Certificates module (Certification Dashboard)
-- =====================================================================
-- This does NOT touch the pre-existing `certificates` table (created in
-- create_skill_assessment_tables.sql), which continues to power the
-- CareerLens Certificates section exactly as it does today.
--
-- Four new tables:
--
--   user_certificates                 - "My Certificates": externally
--                                        uploaded certs (source='upload')
--                                        AND completed AI-recommended
--                                        certs that graduate into this
--                                        list (source='recommendation').
--   certificate_recommendation_status - one row per email, marking that
--                                        the ONE-TIME Gemini call for
--                                        this user's Top-5 has already
--                                        been made. Kept independent of
--                                        certificate_recommendations so
--                                        that completing/removing every
--                                        recommendation can never cause
--                                        a re-generation later.
--   certificate_recommendations       - the Top-5 AI recommendations
--                                        for a given email, generated
--                                        exactly once.
--   certificate_progress              - manually-updatable progress
--                                        (0/25/50/75/100) per
--                                        recommendation, one-to-one.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.user_certificates (
    id                uuid NOT NULL DEFAULT gen_random_uuid(),
    email             text NOT NULL,
    certificate_name  text NOT NULL,
    provider          text NOT NULL,
    issue_date        date NOT NULL,
    category          text NOT NULL DEFAULT 'Other',
    file_url          text NOT NULL,
    file_type         text NOT NULL,               -- mime type, e.g. 'application/pdf' | 'image/png'
    source            text NOT NULL DEFAULT 'upload',   -- 'upload' | 'recommendation'
    created_at        timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT user_certificates_pkey PRIMARY KEY (id),
    CONSTRAINT user_certificates_source_check
        CHECK (source IN ('upload', 'recommendation'))
);

CREATE INDEX IF NOT EXISTS idx_user_certificates_email
    ON public.user_certificates (email);


CREATE TABLE IF NOT EXISTS public.certificate_recommendation_status (
    email         text NOT NULL,
    generated_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT certificate_recommendation_status_pkey PRIMARY KEY (email)
);


CREATE TABLE IF NOT EXISTS public.certificate_recommendations (
    id                  uuid NOT NULL DEFAULT gen_random_uuid(),
    email               text NOT NULL,
    certificate_name    text NOT NULL,
    provider            text NOT NULL,
    category            text NOT NULL DEFAULT 'General',
    difficulty          text NOT NULL,              -- 'Beginner' | 'Intermediate' | 'Advanced'
    estimated_duration  text NOT NULL,
    description         text NOT NULL,
    skills_learned      jsonb NOT NULL DEFAULT '[]'::jsonb,
    career_benefits     jsonb NOT NULL DEFAULT '[]'::jsonb,
    prerequisites       jsonb NOT NULL DEFAULT '[]'::jsonb,
    official_link       text NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT certificate_recommendations_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_certificate_recommendations_email
    ON public.certificate_recommendations (email);


CREATE TABLE IF NOT EXISTS public.certificate_progress (
    recommendation_id  uuid NOT NULL,
    email              text NOT NULL,
    progress_percent   integer NOT NULL DEFAULT 0,
    updated_at         timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT certificate_progress_pkey PRIMARY KEY (recommendation_id),
    CONSTRAINT certificate_progress_recommendation_fk
        FOREIGN KEY (recommendation_id) REFERENCES public.certificate_recommendations (id) ON DELETE CASCADE,
    CONSTRAINT certificate_progress_percent_check
        CHECK (progress_percent IN (0, 25, 50, 75, 100))
);

-- =====================================================================
-- Supabase Storage: this migration assumes a public bucket named
-- 'user-certificates' already exists (Storage -> New Bucket ->
-- "user-certificates" -> Public bucket = on), the same way the
-- pre-existing 'resumes' and 'certificates' buckets are used elsewhere
-- in this project. Storage buckets are not created via SQL migrations
-- in this project. This is a separate bucket from 'certificates' so
-- user-uploaded files never mix with auto-generated Skill Assessment
-- certificate PDFs.
-- =====================================================================
