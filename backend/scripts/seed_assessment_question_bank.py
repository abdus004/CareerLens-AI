"""
Seeds the assessment_question_bank table with 840 real, hand-written MCQs:
7 categories x 3 difficulties x 40 questions each.

Run manually, once, after applying
backend/migrations/create_skill_assessment_tables.sql:

    cd backend
    python -m scripts.seed_assessment_question_bank

To verify the counts afterward (also runs automatically at the end of
a normal seed):

    python -m scripts.seed_assessment_question_bank --verify

Why the question data lives in backend/scripts/assessment_seed_data/
instead of directly in this file: 840 rows of real, reviewable question
text is far easier to author and diff as small per-category Python
modules (one file per category, ~40-line EASY/MEDIUM/HARD lists) than
as one enormous file or a giant SQL INSERT block. This mirrors the
existing seed_question_bank.py's approach of treating this as real,
structured production content rather than throwaway sample data.

Safe to re-run: for every (category, difficulty) bucket, it first
checks whether that bucket already has rows and skips it if so, rather
than appending duplicates - identical idempotency strategy to
seed_question_bank.py.
"""

import sys

from app.database.db import supabase

from scripts.assessment_seed_data.programming_data import (
    PROGRAMMING_EASY,
    PROGRAMMING_MEDIUM,
    PROGRAMMING_HARD,
)
from scripts.assessment_seed_data.sql_data import SQL_EASY, SQL_MEDIUM, SQL_HARD
from scripts.assessment_seed_data.python_data import (
    PYTHON_EASY,
    PYTHON_MEDIUM,
    PYTHON_HARD,
)
from scripts.assessment_seed_data.java_data import JAVA_EASY, JAVA_MEDIUM, JAVA_HARD
from scripts.assessment_seed_data.aptitude_data import (
    APTITUDE_EASY,
    APTITUDE_MEDIUM,
    APTITUDE_HARD,
)
from scripts.assessment_seed_data.reasoning_data import (
    REASONING_EASY,
    REASONING_MEDIUM,
    REASONING_HARD,
)
from scripts.assessment_seed_data.ai_ml_data import AI_ML_EASY, AI_ML_MEDIUM, AI_ML_HARD

# ---------------------------------------------------------------------
# QUESTION_BANK[(category, difficulty)] = [(topic, question, option_a,
#   option_b, option_c, option_d, correct_answer, explanation), ...]
#
# category is one of the exact 7 labels the frontend/backend use:
# 'Programming' | 'Aptitude' | 'Reasoning' | 'SQL' | 'Python' | 'Java' | 'AI/ML'
# difficulty is 'Easy' | 'Medium' | 'Hard'. Every bucket has exactly 40
# questions (verified by verify_counts() below).
# ---------------------------------------------------------------------

QUESTION_BANK = {
    ("Programming", "Easy"): PROGRAMMING_EASY,
    ("Programming", "Medium"): PROGRAMMING_MEDIUM,
    ("Programming", "Hard"): PROGRAMMING_HARD,
    ("Aptitude", "Easy"): APTITUDE_EASY,
    ("Aptitude", "Medium"): APTITUDE_MEDIUM,
    ("Aptitude", "Hard"): APTITUDE_HARD,
    ("Reasoning", "Easy"): REASONING_EASY,
    ("Reasoning", "Medium"): REASONING_MEDIUM,
    ("Reasoning", "Hard"): REASONING_HARD,
    ("SQL", "Easy"): SQL_EASY,
    ("SQL", "Medium"): SQL_MEDIUM,
    ("SQL", "Hard"): SQL_HARD,
    ("Python", "Easy"): PYTHON_EASY,
    ("Python", "Medium"): PYTHON_MEDIUM,
    ("Python", "Hard"): PYTHON_HARD,
    ("Java", "Easy"): JAVA_EASY,
    ("Java", "Medium"): JAVA_MEDIUM,
    ("Java", "Hard"): JAVA_HARD,
    ("AI/ML", "Easy"): AI_ML_EASY,
    ("AI/ML", "Medium"): AI_ML_MEDIUM,
    ("AI/ML", "Hard"): AI_ML_HARD,
}

EXPECTED_PER_BUCKET = 40
EXPECTED_PER_CATEGORY = 120
EXPECTED_TOTAL = 840


def seed():
    total_inserted = 0
    total_skipped_buckets = 0

    for (category, difficulty), questions in QUESTION_BANK.items():
        existing = (
            supabase.table("assessment_question_bank")
            .select("id", count="exact")
            .eq("category", category)
            .eq("difficulty", difficulty)
            .execute()
        )

        if (existing.count or 0) > 0:
            total_skipped_buckets += 1
            continue

        rows = [
            {
                "category": category,
                "difficulty": difficulty,
                "topic": topic,
                "question": question,
                "option_a": option_a,
                "option_b": option_b,
                "option_c": option_c,
                "option_d": option_d,
                "correct_answer": correct_answer,
                "explanation": explanation,
            }
            for (
                topic,
                question,
                option_a,
                option_b,
                option_c,
                option_d,
                correct_answer,
                explanation,
            ) in questions
        ]

        # Insert in a couple of batches rather than one 40-row call, to
        # stay comfortably under any single-request payload limits.
        for i in range(0, len(rows), 20):
            supabase.table("assessment_question_bank").insert(rows[i : i + 20]).execute()

        total_inserted += len(rows)
        print(f"  Seeded {category} / {difficulty}: {len(rows)} questions")

    print(f"\nInserted {total_inserted} questions.")
    print(f"Skipped {total_skipped_buckets} bucket(s) that already had data.")


def verify_counts():
    """
    Confirms the live Supabase table matches what the feature spec
    requires: 7 categories x 3 difficulties x 40 = 840 total, with each
    category at exactly 120 (40 Easy + 40 Medium + 40 Hard).
    """
    print("\nVerifying assessment_question_bank counts against Supabase...")
    all_ok = True
    grand_total = 0

    categories = ["Programming", "Aptitude", "Reasoning", "SQL", "Python", "Java", "AI/ML"]
    difficulties = ["Easy", "Medium", "Hard"]

    for category in categories:
        category_total = 0
        row = [category]
        for difficulty in difficulties:
            response = (
                supabase.table("assessment_question_bank")
                .select("id", count="exact")
                .eq("category", category)
                .eq("difficulty", difficulty)
                .execute()
            )
            count = response.count or 0
            category_total += count
            ok = count == EXPECTED_PER_BUCKET
            all_ok = all_ok and ok
            row.append(f"{difficulty}={count}{'' if ok else ' (EXPECTED 40)'}")

        grand_total += category_total
        category_ok = category_total == EXPECTED_PER_CATEGORY
        all_ok = all_ok and category_ok
        print(
            f"  {category:12s} | {', '.join(row[1:]):45s} | total={category_total}"
            f"{'' if category_ok else f' (EXPECTED {EXPECTED_PER_CATEGORY})'}"
        )

    print(f"\nGRAND TOTAL: {grand_total} (expected {EXPECTED_TOTAL})")
    if all_ok and grand_total == EXPECTED_TOTAL:
        print("All counts verified correctly.")
    else:
        print("COUNT MISMATCH DETECTED - see above.")
        sys.exit(1)


if __name__ == "__main__":
    if "--verify" in sys.argv:
        verify_counts()
    else:
        seed()
        verify_counts()
