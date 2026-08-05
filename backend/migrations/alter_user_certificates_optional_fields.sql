-- =====================================================================
-- Migration: Make external certificate detail fields optional
-- =====================================================================
-- Certificate File remains the ONLY required field when uploading to
-- My Certificates. certificate_name / provider / category always get
-- a server-computed fallback before insert (see
-- user_certificate_service.add_user_certificate), so those three stay
-- NOT NULL under the hood - the frontend can never actually send an
-- empty value through to Postgres for them.
--
-- issue_date is the one field the product wants to store as a genuine
-- NULL when the user leaves it blank ("Issue date not specified" in
-- the UI), so its NOT NULL constraint needs to be dropped.
-- =====================================================================

ALTER TABLE public.user_certificates
    ALTER COLUMN issue_date DROP NOT NULL;
