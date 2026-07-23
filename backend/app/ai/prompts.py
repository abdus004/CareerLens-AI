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