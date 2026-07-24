from app.ai.gemini import generate_json


def analyze_resume(resume_text: str):

    prompt = f"""
You are an expert ATS Resume Analyzer.

Analyze the following resume.

Return ONLY valid JSON.

Required JSON format:

{{
    "resume_score": 0,
    "resume_rating": "",
    "ats_score": 0,
    "grammar_score": 0,
    "keyword_score": 0,
    "formatting_score": 0,
    "suggestions": [
        "",
        "",
        "",
        ""
    ]
}}

Rules:
- resume_score should be between 0 and 100.
- resume_rating should be one of:
  Excellent
  Good
  Average
  Needs Improvement

- ATS score should evaluate ATS friendliness.
- Grammar score should evaluate grammar.
- Keyword score should evaluate resume keywords.
- Formatting score should evaluate formatting.

Suggestions should contain exactly four actionable improvements.

Resume:

{resume_text}
"""

    return generate_json(prompt)