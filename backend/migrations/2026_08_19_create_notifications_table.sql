-- =====================================================================
-- Migration: Notifications (Dashboard bell)
-- =====================================================================
-- One new table, following the same email-keyed, no-RLS pattern
-- already used throughout this project (resume_analysis, feedback,
-- support_tickets, ...) - RLS is not enabled anywhere in this schema;
-- every Supabase call is made from the FastAPI backend only, never
-- from the browser (see frontend/src/services/api.js - there is no
-- @supabase/supabase-js in the frontend at all). Row ownership is
-- instead enforced in app/routes/notifications.py via require_self()
-- on every read/write, same as every other per-user table in this app.
--
-- `type` is a free-form short tag (e.g. "resume", "skills", "career",
-- "learning_path", "jobs", "drive_deadline", "certificate",
-- "certificate_relevance") used only for icon selection on the
-- frontend - not constrained via CHECK so a new event type can be
-- added later without another migration.
--
-- `link` is an optional in-app route (e.g. "/resume-analyzer") the
-- bell dropdown navigates to on click - see
-- components/dashboard/NotificationBell.jsx.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id          uuid NOT NULL DEFAULT gen_random_uuid(),
    email       text NOT NULL,
    type        text NOT NULL,
    title       text NOT NULL,
    message     text NOT NULL,
    link        text,
    is_read     boolean NOT NULL DEFAULT false,
    created_at  timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

-- Every read is "give me this user's notifications, newest first" and
-- every dedup check is "does this user already have a notification of
-- this exact type + title" - this composite index serves both.
CREATE INDEX IF NOT EXISTS idx_notifications_email_created
    ON public.notifications (email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_email_type_title
    ON public.notifications (email, type, title);
