-- =====================================================================
-- Migration: Settings + Help & Support modules
-- =====================================================================
-- Reuses the existing `profiles` table for everything that is
-- genuinely per-profile state (avatar, theme, notification prefs)
-- instead of creating a parallel "user_settings" table - profiles is
-- already the single row-per-email source of truth for this app (see
-- routes/profile.py, routes/dashboard.py).
--
-- Two new tables, both following the same email-keyed, no-RLS pattern
-- already used throughout this project (resume_analysis, feedback-like
-- tables, etc.) - RLS is not enabled anywhere in this schema; every
-- Supabase call is made from the FastAPI backend only, never from the
-- browser (see frontend/src/services/api.js - there is no
-- @supabase/supabase-js in the frontend at all).
--
--   feedback         - Help & Support > Feedback (star rating + message)
--   support_tickets  - Help & Support > Contact Support
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Extend profiles with Settings fields
-- ---------------------------------------------------------------------

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS avatar_url text,
    ADD COLUMN IF NOT EXISTS theme_preference text NOT NULL DEFAULT 'dark',
    ADD COLUMN IF NOT EXISTS notif_email_enabled boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS notif_job_alerts_enabled boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS notif_weekly_summary_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_theme_preference_check;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_theme_preference_check
    CHECK (theme_preference = ANY (ARRAY['dark'::text, 'light'::text]));

-- ---------------------------------------------------------------------
-- 2. Feedback (Help & Support > Feedback)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.feedback (
    id          uuid NOT NULL DEFAULT gen_random_uuid(),
    email       text NOT NULL,
    rating      integer NOT NULL,
    message     text,
    created_at  timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT feedback_pkey PRIMARY KEY (id),
    CONSTRAINT feedback_rating_check CHECK (rating >= 1 AND rating <= 5)
);

CREATE INDEX IF NOT EXISTS idx_feedback_email ON public.feedback (email);

-- ---------------------------------------------------------------------
-- 3. Support Tickets (Help & Support > Contact Support)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id                 uuid NOT NULL DEFAULT gen_random_uuid(),
    ticket_reference   text NOT NULL UNIQUE,
    email              text NOT NULL,
    subject            text NOT NULL,
    category           text NOT NULL,
    priority           text NOT NULL DEFAULT 'Medium',
    message            text NOT NULL,
    attachment_url     text,
    attachment_name    text,
    status             text NOT NULL DEFAULT 'Open',
    created_at         timestamp with time zone NOT NULL DEFAULT now(),
    updated_at         timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT support_tickets_pkey PRIMARY KEY (id),
    CONSTRAINT support_tickets_priority_check CHECK (priority = ANY (ARRAY['Low'::text, 'Medium'::text, 'High'::text])),
    CONSTRAINT support_tickets_status_check CHECK (status = ANY (ARRAY['Open'::text, 'In Progress'::text, 'Resolved'::text, 'Closed'::text]))
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON public.support_tickets (email);

-- =====================================================================
-- Supabase Storage - manual setup (buckets are not created via SQL in
-- this project; see create_certificates_module_tables.sql for the same
-- convention). Create these two PUBLIC buckets in the Supabase
-- dashboard, matching the existing 'resumes' / 'user-certificates'
-- buckets which are also public and read via get_public_url():
--
--   avatars              - profile pictures (Settings > Profile)
--   support-attachments  - Contact Support optional file attachments
-- =====================================================================
