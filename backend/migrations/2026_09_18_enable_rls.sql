-- =====================================================================
-- CareerLens-AI: Enable Row Level Security
-- Date: 2026-09-18
--
-- Initial architecture:
-- Browser -> FastAPI -> Supabase
--
-- The frontend does NOT directly access Supabase tables.
-- Backend table access uses the service-role client.
--
-- Therefore this migration ENABLES RLS but intentionally creates
-- NO anon/authenticated policies.
--
-- IMPORTANT:
-- The users table is intentionally excluded. It is not part of the
-- application's current table-access inventory.
-- =====================================================================

BEGIN;

ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_recommendation_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_match_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_topic_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_resume_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certificates ENABLE ROW LEVEL SECURITY;

COMMIT;