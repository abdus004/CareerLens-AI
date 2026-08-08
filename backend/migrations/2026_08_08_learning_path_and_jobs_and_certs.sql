-- Migration: Learning Path details persistence, Job Recommendations
-- count, and free-form Certificate progress.
--
-- Every change below is additive/relaxing only - nothing here drops or
-- narrows anything an existing feature already depends on.
--
-- Run manually against the Supabase project, once:
--   psql "$DATABASE_URL" -f backend/migrations/2026_08_08_learning_path_and_jobs_and_certs.sql

-- ---------------------------------------------------------------------
-- 1. LEARNING PATH - "Start Learning" details, generated once via
--    Gemini and persisted per (role, skill) pair (see
--    services/learning_path_service.get_or_generate_topic_details).
--    The table already existed in the schema but had no uniqueness
--    guarantee; without it, two near-simultaneous first-time "Start
--    Learning" clicks for the same never-yet-generated (role, skill)
--    pair could each call Gemini and insert a duplicate row, and a
--    plain upsert(on_conflict="role,skill") has nothing to target.
-- ---------------------------------------------------------------------

ALTER TABLE public.learning_path_topic_details
  ADD CONSTRAINT learning_path_topic_details_role_skill_key
  UNIQUE (role, skill);


-- ---------------------------------------------------------------------
-- 2. JOB RECOMMENDATIONS - "Showing X of Y matching jobs". X is simply
--    len(recommendations) already returned; Y (the size of the active
--    pool the Top N were ranked against) has nowhere to live once
--    persisted, so it needs its own column rather than being
--    recomputed on every GET (which would mean re-fetching every
--    active job just to count them).
-- ---------------------------------------------------------------------

ALTER TABLE public.job_recommendations
  ADD COLUMN total_matching integer NOT NULL DEFAULT 0;


-- ---------------------------------------------------------------------
-- 3. CERTIFICATES - Recommended Certification progress must support
--    ANY value 0-100 (a real slider), not just the fixed
--    {0, 25, 50, 75, 100} steps the original CHECK constraint allowed.
--    Postgres has no ALTER CONSTRAINT to widen a CHECK in place, so
--    the old constraint is dropped and replaced with a range check.
-- ---------------------------------------------------------------------

ALTER TABLE public.certificate_progress
  DROP CONSTRAINT IF EXISTS certificate_progress_progress_percent_check;

ALTER TABLE public.certificate_progress
  ADD CONSTRAINT certificate_progress_progress_percent_check
  CHECK (progress_percent >= 0 AND progress_percent <= 100);
