-- =====================================================================
-- Migration: AI Mock Interview feature
-- Date: 2026-07-31
-- =====================================================================
-- Four new tables. question_bank is the reusable, pre-curated pool of
-- interview questions (seeded separately by
-- backend/scripts/seed_question_bank.py - see that file for why the
-- ~500 questions live in a Python script rather than a giant SQL
-- INSERT block). interviews/interview_answers/interview_results model
-- one interview attempt end to end.
--
-- Unlike the rest of this project's schema (which loosely joins on
-- `email` with no real foreign keys), interview_answers and
-- interview_results use genuine FOREIGN KEY ... ON DELETE CASCADE
-- constraints back to interviews.id. That's a deliberate difference,
-- not an inconsistency: those two tables are true one-to-many child
-- data of a single interview attempt (they cannot meaningfully exist
-- without it), which is exactly the case real FKs are for - whereas
-- tables like skill_analysis or career_analysis are one-per-user
-- singletons where `email` alone is a simpler, sufficient key.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.question_bank (
    id               uuid NOT NULL DEFAULT gen_random_uuid(),
    role             text,               -- NULL = not role-specific (General Technical, HR, Behavioral)
    interview_type   text NOT NULL,      -- 'Technical' | 'HR' | 'Behavioral'
    difficulty       text NOT NULL,      -- 'Easy' | 'Medium' | 'Hard'
    question_text    text NOT NULL,
    created_at       timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT question_bank_pkey PRIMARY KEY (id),
    CONSTRAINT question_bank_interview_type_check
        CHECK (interview_type IN ('Technical', 'HR', 'Behavioral')),
    CONSTRAINT question_bank_difficulty_check
        CHECK (difficulty IN ('Easy', 'Medium', 'Hard'))
);

-- Matches the app's actual read pattern: every candidate-pool fetch
-- filters on exactly these three columns together.
CREATE INDEX IF NOT EXISTS idx_question_bank_lookup
    ON public.question_bank (interview_type, difficulty, role);


CREATE TABLE IF NOT EXISTS public.interviews (
    id               uuid NOT NULL DEFAULT gen_random_uuid(),
    email            text NOT NULL,
    interview_type   text NOT NULL,      -- 'Technical' | 'HR' | 'Behavioral' | 'Mixed'
    target_role      text,               -- display label, e.g. "AI Engineer" / "Other: Prompt Engineer" / NULL for General
    difficulty       text NOT NULL,      -- 'Easy' | 'Medium' | 'Hard'
    num_questions    integer NOT NULL,
    question_ids     jsonb NOT NULL,     -- ordered array of question_bank.id actually selected for this attempt
    status           text NOT NULL DEFAULT 'in_progress',   -- 'in_progress' | 'completed'
    created_at       timestamptz NOT NULL DEFAULT now(),
    completed_at     timestamptz,

    CONSTRAINT interviews_pkey PRIMARY KEY (id),
    CONSTRAINT interviews_interview_type_check
        CHECK (interview_type IN ('Technical', 'HR', 'Behavioral', 'Mixed')),
    CONSTRAINT interviews_difficulty_check
        CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    CONSTRAINT interviews_status_check
        CHECK (status IN ('in_progress', 'completed')),
    CONSTRAINT interviews_num_questions_check
        CHECK (num_questions IN (5, 10, 15, 20))
);

CREATE INDEX IF NOT EXISTS idx_interviews_email ON public.interviews (email);


CREATE TABLE IF NOT EXISTS public.interview_answers (
    id                    uuid NOT NULL DEFAULT gen_random_uuid(),
    interview_id          uuid NOT NULL,
    question_number       integer NOT NULL,
    question_id           uuid,               -- nullable: kept even if the source question_bank row is later removed
    question_text         text NOT NULL,       -- snapshot at selection time - survives edits/deletes to question_bank
    answer_text           text NOT NULL DEFAULT '',
    time_taken_seconds    integer NOT NULL DEFAULT 0,
    skipped               boolean NOT NULL DEFAULT false,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT interview_answers_pkey PRIMARY KEY (id),
    CONSTRAINT interview_answers_interview_fk
        FOREIGN KEY (interview_id) REFERENCES public.interviews (id) ON DELETE CASCADE,
    CONSTRAINT interview_answers_question_fk
        FOREIGN KEY (question_id) REFERENCES public.question_bank (id) ON DELETE SET NULL,

    -- Makes "Save & Next" on the same question idempotent (an upsert,
    -- not a new row every time the student edits an answer).
    CONSTRAINT interview_answers_unique_question UNIQUE (interview_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_interview_answers_interview
    ON public.interview_answers (interview_id);


CREATE TABLE IF NOT EXISTS public.interview_results (
    interview_id             uuid NOT NULL,
    overall_score            integer,
    technical_score          integer,
    communication_score      integer,
    english_score            integer,
    confidence_score         integer,
    vocabulary_score         integer,
    per_question_feedback    jsonb,     -- [{ question_number, score, feedback }, ...]
    strengths                jsonb,     -- [string, ...]
    areas_to_improve         jsonb,     -- [string, ...]
    final_recommendation     text,
    created_at               timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT interview_results_pkey PRIMARY KEY (interview_id),
    CONSTRAINT interview_results_interview_fk
        FOREIGN KEY (interview_id) REFERENCES public.interviews (id) ON DELETE CASCADE
);