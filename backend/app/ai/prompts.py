def career_recommendation_prompt(profile: dict) -> str:
    return f"""
You are CareerLens AI, an expert AI Career Advisor.

Analyze the student's complete profile and recommend the best IT career path.

Student Profile:

{profile}

IMPORTANT:

- Use skill_levels as the PRIMARY source for evaluating technical skills.
- Resume skills should only provide additional context.
- If the user has manually edited a skill level, always trust skill_levels.
- Recommend only realistic IT careers.
- Use realistic industry trends and current IT market demand.

Return ONLY valid JSON.

Do NOT use markdown.
Do NOT use ```json.
Do NOT write explanations outside JSON.

Return EXACTLY this structure:

{{
    "recommended_role": "",
    "match_score": 0,

    "reason": "",

    "top_roles": [
        {{
            "role": "",
            "score": 0
        }}
    ],

    "profile_strengths": [],

    "industry_insights": {{
        "average_salary": "",
        "industry_demand": "",
        "future_growth": "",
        "competition": ""
    }},

    "industry_graph": [
        {{
            "year": "2024",
            "demand": 0
        }},
        {{
            "year": "2025",
            "demand": 0
        }},
        {{
            "year": "2026",
            "demand": 0
        }},
        {{
            "year": "2027",
            "demand": 0
        }},
        {{
            "year": "2028",
            "demand": 0
        }}
    ],

    "growth_percentage": 0,

    "job_opportunities": ""
}}

Rules:

- Recommend ONLY IT careers.
- Match score must be between 0 and 100.
- Return exactly 5 top_roles sorted from highest score to lowest.
- profile_strengths should contain 4–6 concise strengths based on the student's profile.

- average_salary should be returned ONLY in compact LPA format.

Examples:
"6-14 LPA"
"8-18 LPA"
"10-25 LPA"

Do NOT return ₹6,50,000 or ₹14,00,000.

- industry_demand must be one of:
  Low
  Moderate
  High
  Very High

- future_growth must be one of:
  Low
  Good
  High
  Excellent

- competition must be one of:
  Low
  Medium
  High

- job_opportunities should be a realistic estimate of total available opportunities in India.

Examples:
"850K+"
"1.2M+"
"2.1M+"

- growth_percentage must be an integer between 5 and 60 representing expected industry growth over the next five years.

Examples:
18
25
35
42

- industry_graph must contain EXACTLY five objects.

Years must be:
2024
2025
2026
2027
2028

Each demand value must be an integer between 20 and 100.

The graph should represent realistic industry demand progression for the recommended career.

Examples:

Backend Developer
[
{{"year":"2024","demand":48}},
{{"year":"2025","demand":61}},
{{"year":"2026","demand":74}},
{{"year":"2027","demand":88}},
{{"year":"2028","demand":100}}
]

AI Engineer
[
{{"year":"2024","demand":55}},
{{"year":"2025","demand":70}},
{{"year":"2026","demand":84}},
{{"year":"2027","demand":94}},
{{"year":"2028","demand":100}}
]

Frontend Developer
[
{{"year":"2024","demand":42}},
{{"year":"2025","demand":51}},
{{"year":"2026","demand":59}},
{{"year":"2027","demand":66}},
{{"year":"2028","demand":72}}
]

- reason should be a concise paragraph (2–4 sentences) explaining why the recommended role best matches the student's skills, education, interests and current profile.

- Return ONLY valid JSON.
"""

def profile_resume_analysis_prompt(resume_text: str) -> str:
    return f"""
You are CareerLens AI, an expert resume reviewer and ATS (Applicant
Tracking System) analyst.

Analyze the following resume text and return a complete, structured
analysis.

Resume Text:

{resume_text}

Return ONLY valid JSON in exactly this structure:

{{
    "resume_score": 0,
    "ats_score": 0,
    "keyword_score": 0,
    "formatting_score": 0,
    "grammar_score": 0,
    "missing_skills": [],
    "strengths": [],
    "weaknesses": [],
    "ai_summary": "",

    "skills": [],
    "education": [],
    "experience": [],
    "projects": [],
    "certifications": [],
    "languages": [],

    "suggestions": [
        {{
            "title": "",
            "description": "",
            "priority": "High"
        }}
    ]
}}

Rules:

- All *_score fields must be integers between 0 and 100.
- missing_skills: important skills for this candidate's apparent field that are absent from the resume (maximum 8).
- strengths / weaknesses: short, specific bullet points (maximum 5 each).
- ai_summary: 2-3 sentences, plain language, no markdown.
- skills: every distinct technical skill actually found in the resume text.
- education: list of objects like {{"degree": "", "institution": "", "year": ""}}.
- experience: list of objects like {{"role": "", "company": "", "duration": "", "description": ""}} for internships/jobs found in the resume.
- projects: list of objects like {{"name": "", "description": ""}}.
- certifications: list of objects like {{"name": "", "organization": "", "year": ""}}.
- languages: spoken/written languages if explicitly mentioned, otherwise an empty list - never guess.
- suggestions: 3-5 concrete, actionable improvements. priority must be "High", "Medium", or "Low".
- Never invent information that is not present in the resume text.
- Return ONLY valid JSON, no markdown fences, no commentary.
"""

def skill_analysis_prompt(profile):

    return f"""
You are CareerLens AI, an expert technical interviewer and software engineering mentor.

Analyze the student's complete profile.

Profile:
{profile}

Return ONLY valid JSON.

{{
    "overall_score": 0,

    "technical_skills": [
        {{
            "skill": "",
            "score": 0,
            "level": ""
        }}
    ],

    "soft_skills": [
        {{
            "skill": "",
            "score": 0
        }}
    ],

    "important_skills": [
        ""
    ],

    "strengths": [],

    "weak_skills": [],

    "recommended_courses": [],

    "estimated_learning_time": ""
}}

Rules:

- overall_score must be between 0 and 100.
- score must be between 0 and 100.
- level must be Beginner, Intermediate or Advanced.
- Analyze both the resume and profile.
- Use the latest skill_levels as the primary source of truth.
- technical_skills should contain all relevant technical skills.
- important_skills must contain EXACTLY the 6 most important technical skills for the student's strongest/recommended career path.
- The skills in important_skills MUST also exist inside technical_skills.
- Order important_skills from most important to least important.
- weak_skills should contain only the most important technologies the student should learn next (maximum 5).
- recommended_courses should recommend practical online courses or certifications matching the weak skills (maximum 5).
- estimated_learning_time should be realistic (example: "2–3 Months", "4–6 Months", "6–9 Months").
- Return ONLY valid JSON.
"""


def job_match_explanation_prompt(
    profile: dict,
    job: dict,
    matched_skills: list,
    missing_skills: list,
    match_percentage: int,
) -> str:
    """
    IMPORTANT - scope of this prompt:

    The AI Match percentage, the ranking of jobs, and the exact lists of
    matched/missing skills below are ALL already calculated by a
    deterministic matching engine before this prompt ever runs (see
    services/job_matching_service.py). Gemini is not used to generate
    jobs, calculate match scores, filter jobs, or rank jobs anywhere in
    this feature - it is only ever used to WRITE the three short pieces
    of narrative text below, grounded in numbers/lists it is given, not
    numbers/lists it invents.
    """

    return f"""
You are CareerLens AI, an expert career mentor.

A separate recommendation engine (NOT you) has already calculated that
this student is a {match_percentage}% match for the job below, and has
already determined exactly which required skills the student has and
which they are missing. Do NOT recalculate, question, second-guess, or
restate a different match percentage or skill list - only explain the
ones given to you.

Student Profile:
{profile}

Job:
{job}

Skills The Student Already Has (for this job): {matched_skills}
Skills The Student Is Missing (for this job): {missing_skills}
Match Percentage (already calculated - do not change): {match_percentage}%

Return ONLY valid JSON.

{{
    "why_this_job_matches": "",
    "missing_skill_explanation": "",
    "suggested_next_steps": [
        ""
    ]
}}

Rules:

- why_this_job_matches should be a concise, encouraging paragraph (2–4 sentences) explaining why the student's existing skills, education and interests make them a good fit for this specific role and company - grounded only in the matched skills and profile given above.

- missing_skill_explanation should be a concise paragraph (2–3 sentences) explaining, in plain language, why the missing skills listed above matter for this specific role. If the missing skills list is empty, say so encouragingly instead of inventing gaps.

- suggested_next_steps must contain exactly 3–5 short, actionable steps the student can take to close the gap and become a stronger candidate for this specific role.

- Do NOT invent additional missing skills beyond the ones explicitly listed above.

- Do NOT invent additional matched skills beyond the ones explicitly listed above.

- Do NOT change, recalculate, or restate a different match percentage anywhere in your response.

- Return ONLY valid JSON.

Do NOT use markdown.
Do NOT use ```json.
Do NOT write explanations outside JSON.
"""


def interview_question_selection_prompt(
    candidate_questions: list,
    interview_type: str,
    target_role: str,
    difficulty: str,
    num_questions: int,
) -> str:
    """
    IMPORTANT - scope of this prompt (Gemini Call 1 of 2 for Mock
    Interview):

    Every candidate question below already exists in the pre-curated
    question_bank table and was already filtered to the right
    interview_type/role/difficulty by deterministic backend code (see
    services/question_bank_service.py) BEFORE this prompt ever runs.
    Gemini is not used to write new interview questions, judge
    difficulty, or decide topic relevance - it is only ever used to
    CHOOSE a well-spread subset of exactly num_questions ids from the
    exact list given below, so that one interview doesn't feel like a
    random unordered dump of similar questions. If this call fails or
    returns something invalid, the backend falls back to a plain
    random sample from this same list - an interview must always be
    able to start.
    """

    numbered = "\n".join(
        f'{q["id"]} :: {q["question_text"]}' for q in candidate_questions
    )

    return f"""
You are CareerLens AI, curating a mock interview for a student.

Interview Type: {interview_type}
Target Role: {target_role or "General (no specific role)"}
Difficulty: {difficulty}
Number Of Questions Needed: {num_questions}

Below is the ONLY pool of questions you are allowed to choose from.
Each line is "id :: question text". You must select IDs only from this
exact list - never invent a new id, never rewrite or paraphrase a
question's text.

{numbered}

Return ONLY valid JSON.

{{
    "selected_question_ids": [
        ""
    ]
}}

Rules:

- selected_question_ids must contain EXACTLY {num_questions} ids, and every id must be copied exactly as it appears before the "::" above.
- Do NOT repeat the same id twice.
- Do NOT select two or more questions that are essentially asking the same thing - prefer breadth across different sub-topics over near-duplicates.
- Order the ids so the interview has a sensible flow (e.g. broader/foundational questions before narrower/advanced ones), not necessarily the order they appeared above.
- Do NOT invent a question id that is not in the list above.
- Return ONLY valid JSON.

Do NOT use markdown.
Do NOT use ```json.
Do NOT write explanations outside JSON.
"""


def skill_assessment_feedback_prompt(
    category: str,
    difficulty: str,
    percentage: float,
    correct_count: int,
    incorrect_count: int,
    skipped_count: int,
    topic_performance: list,
    incorrect_topics: list,
    time_taken_seconds: int,
    duration_seconds: int,
) -> str:
    """
    IMPORTANT - scope of this prompt (the ONLY Gemini call the Skill
    Assessment feature makes):

    Every number below - the score, the correct/incorrect/skipped
    counts, and the topic-wise percentages - was already computed by
    deterministic backend code (see services/assessment_scoring_service.py)
    BEFORE this prompt ever runs. Gemini is never used to grade
    answers, decide pass/fail, or recompute the percentage - it is only
    ever used to WRITE three short, practical lists (strengths,
    weak_areas, recommendations) grounded in the numbers given here. If
    this call fails for any reason, the assessment's score still stands
    on its own - see routes/skill_assessment.py.
    """

    topic_lines = "\n".join(
        f'- {t["topic"]}: {t["correct"]}/{t["total"]} correct ({t["percentage"]}%)'
        for t in topic_performance
    )

    return f"""
You are CareerLens AI, an expert technical mentor giving concise, practical feedback after a completed skill assessment.

Assessment Category: {category}
Difficulty: {difficulty}
Overall Percentage (already calculated - do not change): {percentage}%
Correct: {correct_count}
Incorrect: {incorrect_count}
Skipped: {skipped_count}
Time Used: {time_taken_seconds} of {duration_seconds} seconds allotted

Topic-Wise Performance (already calculated - do not change):
{topic_lines or "- No topic data available."}

Topics With At Least One Incorrect Answer: {", ".join(incorrect_topics) if incorrect_topics else "None"}

Return ONLY valid JSON.

{{
    "strengths": [
        ""
    ],
    "weak_areas": [
        ""
    ],
    "recommendations": [
        ""
    ]
}}

Rules:

- strengths must list 2-5 short, specific topics or skills the student is genuinely strong in, based only on the topic performance above (favor topics at or near 100%). If nothing stands out clearly, give general encouragement based on the overall percentage instead of inventing a strength.
- weak_areas must list 1-5 short, specific topics the student should focus on next, based only on the topic performance and incorrect-topics data above. If the student scored 100%, return an empty list rather than inventing a weakness.
- recommendations must list 3-5 concise, actionable study suggestions (e.g. "Practice try/except scenarios", "Revisit JOIN types with worked examples") that directly address the weak areas identified above.
- Do NOT recalculate, question, or restate a different percentage, score, or pass/fail result anywhere in your response.
- Do NOT invent topics that are not present in the topic performance data above.
- Keep every item short (under 12 words) and practical - no generic filler like "keep practicing".
- Return ONLY valid JSON.

Do NOT use markdown.
Do NOT use ```json.
Do NOT write explanations outside JSON.
"""


def interview_evaluation_prompt(
    interview_type: str,
    target_role: str,
    difficulty: str,
    answers: list,
) -> str:
    """
    IMPORTANT - scope of this prompt (Gemini Call 2 of 2 for Mock
    Interview, and the ONLY other Gemini call this feature makes):

    Called exactly once, after the student has finished the entire
    interview - never after each individual question. Gemini's job
    here is purely evaluative: score and give feedback on answers that
    already exist. It does not choose which questions were asked (that
    was Call 1) and it never runs mid-interview.
    """

    transcript = "\n\n".join(
        f'Question {a["question_number"]}: {a["question_text"]}\n'
        f'Answer: {"[SKIPPED - no answer given]" if a.get("skipped") else (a.get("answer_text") or "[No answer given]")}\n'
        f'Time Taken: {a.get("time_taken_seconds", 0)} seconds'
        for a in answers
    )

    return f"""
You are CareerLens AI, an experienced technical and HR interviewer giving honest, constructive feedback after a completed mock interview.

Interview Type: {interview_type}
Target Role: {target_role or "General (no specific role)"}
Difficulty: {difficulty}
Total Questions: {len(answers)}

Full Interview Transcript (questions, the student's answers, and time taken):

{transcript}

Return ONLY valid JSON.

{{
    "overall_score": 0,
    "technical_knowledge_score": 0,
    "communication_score": 0,
    "english_score": 0,
    "confidence_score": 0,
    "vocabulary_score": 0,
    "per_question_feedback": [
        {{
            "question_number": 0,
            "score": 0,
            "feedback": ""
        }}
    ],
    "strengths": [
        ""
    ],
    "areas_to_improve": [
        ""
    ],
    "final_recommendation": ""
}}

Rules:

- Every score (overall_score, technical_knowledge_score, communication_score, english_score, confidence_score, vocabulary_score, and each per-question score) must be an integer between 0 and 100.
- overall_score should reasonably reflect the average quality across all answers, weighted toward technical_knowledge_score for a Technical interview and toward communication_score for an HR/Behavioral interview.
- A skipped question must receive a low score (0-20) and feedback that plainly notes it was skipped - do not penalize the rest of the interview's scores more than that one question's score already reflects.
- per_question_feedback must contain exactly one entry per question above, in the same order, each with concise (1-3 sentence), specific, practical feedback - not generic praise.
- strengths must contain 2-5 short, specific, genuine strengths actually observed in the answers given.
- areas_to_improve must contain 2-5 short, specific, actionable areas to work on - not vague criticism.
- final_recommendation must be a concise (2-4 sentence) overall verdict on the student's readiness for this type of interview at this difficulty, written directly to the student, in an encouraging but honest tone.
- Base every score and comment only on the transcript given above - do not assume information about the student that isn't in it.
- Return ONLY valid JSON.

Do NOT use markdown.
Do NOT use ```json.
Do NOT write explanations outside JSON.
"""