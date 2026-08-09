-- Migration: certificate recommendation staleness detection.
--
-- Adds ONE column - certificate_recommendation_status already existed
-- and already gated one-time Gemini generation; this just gives it
-- somewhere to store the fingerprint of the inputs that generation
-- was based on, so a later genuine change (Skill Analysis, Career
-- Intelligence/Career Goal, Resume Data) can be detected without a
-- second recommendation engine or a second Gemini call site.
--
-- Existing rows get NULL here (safe - see
-- certificate_recommendation_service.get_or_generate_recommendations,
-- which treats a NULL stored fingerprint as "nothing to compare
-- against yet" rather than immediately forcing every existing user's
-- next page load to regenerate).
--
-- Run once against the Supabase project:
--   psql "$DATABASE_URL" -f backend/migrations/2026_08_09_certificate_recommendation_fingerprint.sql

ALTER TABLE public.certificate_recommendation_status
  ADD COLUMN match_inputs_fingerprint text;
