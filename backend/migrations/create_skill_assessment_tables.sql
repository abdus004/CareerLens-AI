-- =====================================================================
-- Migration: Skill Assessment feature
-- =====================================================================
-- Five new tables, following the same shape the Mock Interview feature
-- already established in create_mock_interview_tables.sql:
--
--   assessment_question_bank  - reusable, pre-curated MCQ pool, seeded
--                                separately by
--                                backend/scripts/seed_assessment_question_bank.py
--   assessments                - one row per attempt (setup + timing)
--   assessment_answers         - one row per question answered/skipped
--                                within an attempt
--   assessment_results         - one row per completed attempt (score +
--                                topic performance + AI feedback)
--   certificates                - one row per earned certificate
--
-- Like interview_answers/interview_results, assessment_answers /
-- assessment_results / certificates use real FOREIGN KEY ... ON DELETE
-- CASCADE constraints back to assessments.id, since they are true
-- one-to-many/one-to-one child data of a single attempt. The rest of
-- the project's tables (profiles, etc.) loosely join on `email` with
-- no FK, and assessments follows that same convention for `email`
-- since there is no users table with a stable id to reference here.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.assessment_question_bank (
    id               uuid NOT NULL DEFAULT gen_random_uuid(),
    category         text NOT NULL,       -- 'Programming' | 'Aptitude' | 'Reasoning' | 'SQL' | 'Python' | 'Java' | 'AI/ML'
    topic            text NOT NULL,       -- e.g. 'Loops', 'Joins', 'Neural Networks'
    difficulty       text NOT NULL,       -- 'Easy' | 'Medium' | 'Hard'
    question         text NOT NULL,
    option_a         text NOT NULL,
    option_b         text NOT NULL,
    option_c         text NOT NULL,
    option_d         text NOT NULL,
    correct_answer   text NOT NULL,       -- 'A' | 'B' | 'C' | 'D'
    explanation      text NOT NULL,
    created_at       timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT assessment_question_bank_pkey PRIMARY KEY (id),
    CONSTRAINT assessment_question_bank_category_check
        CHECK (category IN ('Programming', 'Aptitude', 'Reasoning', 'SQL', 'Python', 'Java', 'AI/ML')),
    CONSTRAINT assessment_question_bank_difficulty_check
        CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    CONSTRAINT assessment_question_bank_correct_answer_check
        CHECK (correct_answer IN ('A', 'B', 'C', 'D'))
);

-- Matches the app's actual read pattern: every question-selection
-- fetch filters on exactly these two columns together.
CREATE INDEX IF NOT EXISTS idx_assessment_question_bank_lookup
    ON public.assessment_question_bank (category, difficulty);


CREATE TABLE IF NOT EXISTS public.assessments (
    id                uuid NOT NULL DEFAULT gen_random_uuid(),
    email             text NOT NULL,
    category          text NOT NULL,
    difficulty        text NOT NULL,
    num_questions     integer NOT NULL,
    question_ids      jsonb NOT NULL,      -- ordered array of assessment_question_bank.id actually selected
    duration_seconds  integer NOT NULL,    -- deterministic: num_questions * per-question seconds for difficulty
    started_at        timestamptz NOT NULL DEFAULT now(),
    expires_at        timestamptz NOT NULL,
    status            text NOT NULL DEFAULT 'in_progress',   -- 'in_progress' | 'completed'
    created_at        timestamptz NOT NULL DEFAULT now(),
    completed_at      timestamptz,

    CONSTRAINT assessments_pkey PRIMARY KEY (id),
    CONSTRAINT assessments_category_check
        CHECK (category IN ('Programming', 'Aptitude', 'Reasoning', 'SQL', 'Python', 'Java', 'AI/ML')),
    CONSTRAINT assessments_difficulty_check
        CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    CONSTRAINT assessments_status_check
        CHECK (status IN ('in_progress', 'completed')),
    CONSTRAINT assessments_num_questions_check
        CHECK (num_questions IN (10, 15, 20))
);

CREATE INDEX IF NOT EXISTS idx_assessments_email ON public.assessments (email);


CREATE TABLE IF NOT EXISTS public.assessment_answers (
    id                uuid NOT NULL DEFAULT gen_random_uuid(),
    assessment_id     uuid NOT NULL,
    question_number   integer NOT NULL,
    question_id       uuid,                -- nullable: kept even if the source question_bank row is later removed
    selected_option   text,                -- 'A' | 'B' | 'C' | 'D' | NULL (not yet answered)
    skipped           boolean NOT NULL DEFAULT false,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT assessment_answers_pkey PRIMARY KEY (id),
    CONSTRAINT assessment_answers_assessment_fk
        FOREIGN KEY (assessment_id) REFERENCES public.assessments (id) ON DELETE CASCADE,
    CONSTRAINT assessment_answers_question_fk
        FOREIGN KEY (question_id) REFERENCES public.assessment_question_bank (id) ON DELETE SET NULL,
    CONSTRAINT assessment_answers_selected_option_check
        CHECK (selected_option IS NULL OR selected_option IN ('A', 'B', 'C', 'D')),

    -- Makes "Save & Next" on the same question idempotent (an upsert,
    -- not a new row every time the student changes an answer).
    CONSTRAINT assessment_answers_unique_question UNIQUE (assessment_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_assessment_answers_assessment
    ON public.assessment_answers (assessment_id);


CREATE TABLE IF NOT EXISTS public.assessment_results (
    assessment_id          uuid NOT NULL,
    total_questions        integer NOT NULL,
    correct_count          integer NOT NULL,
    incorrect_count        integer NOT NULL,
    skipped_count          integer NOT NULL,
    percentage             numeric(5,2) NOT NULL,
    passed                 boolean NOT NULL,
    topic_performance      jsonb NOT NULL,   -- [{ topic, correct, total, percentage }, ...]
    strengths              jsonb,            -- [string, ...] - null if AI feedback failed
    weak_areas             jsonb,            -- [string, ...] - null if AI feedback failed
    recommendations        jsonb,            -- [string, ...] - null if AI feedback failed
    ai_feedback_available  boolean NOT NULL DEFAULT true,
    time_taken_seconds     integer NOT NULL DEFAULT 0,
    created_at             timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT assessment_results_pkey PRIMARY KEY (assessment_id),
    CONSTRAINT assessment_results_assessment_fk
        FOREIGN KEY (assessment_id) REFERENCES public.assessments (id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS public.certificates (
    id                uuid NOT NULL DEFAULT gen_random_uuid(),
    certificate_id    text NOT NULL,        -- short human-readable id shown on the PDF, e.g. 'CLA-7F3A9B2C'
    email             text NOT NULL,
    assessment_id     uuid NOT NULL,
    category          text NOT NULL,
    difficulty        text NOT NULL,
    score             numeric(5,2) NOT NULL,
    pdf_url           text NOT NULL,
    issued_at         timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT certificates_pkey PRIMARY KEY (id),
    CONSTRAINT certificates_certificate_id_unique UNIQUE (certificate_id),
    CONSTRAINT certificates_assessment_fk
        FOREIGN KEY (assessment_id) REFERENCES public.assessments (id) ON DELETE CASCADE,

    -- One qualifying assessment result can only ever unlock one
    -- certificate - this is what makes certificate issuance idempotent.
    CONSTRAINT certificates_assessment_unique UNIQUE (assessment_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_email ON public.certificates (email);

-- =====================================================================
-- Supabase Storage: this migration assumes a public bucket named
-- 'certificates' already exists (Storage -> New Bucket -> "certificates"
-- -> Public bucket = on), the same way the pre-existing 'resumes'
-- bucket is used by app/routes/resume.py. Storage buckets are not
-- created via SQL migrations in this project.
-- =====================================================================
