from app.ai.gemini import generate_json


def generate_learning_path(role: str, skills: list):

    prompt = f"""
You are an experienced software engineering career mentor and hiring manager.

Recommended Role:
{role}

Current Skills:
{skills}

Your task is to create a personalized learning path.

Rules:

1. Recommend ONLY the most important skills required to become job-ready for this role.

2. Select ONLY 6 skills.

3. Arrange them in the correct learning order.

4. Compare each skill with Current Skills.

5. If the exact skill exists:
   - status = completed
   - progress = 100

6. If the user has completed all previous skills but not this one:
   - status = in_progress
   - progress = choose a realistic value between 40 and 80

7. All remaining skills:
   - status = pending
   - progress = 0

8. Every skill must contain:
   - skill
   - level (Beginner / Intermediate / Advanced)
   - duration
   - status
   - progress

9. Maximum ONE skill can have status "in_progress".

10. Never assume similar technologies are the same.

Examples:
Python ≠ Java
SQL ≠ PostgreSQL
React ≠ Next.js
FastAPI ≠ Flask

Return ONLY valid JSON.

Example:

{{
    "role": "{role}",
    "learning_path": [
        {{
            "skill": "Python",
            "level": "Beginner",
            "duration": "2 Weeks",
            "status": "completed",
            "progress": 100
        }},
        {{
            "skill": "Data Structures",
            "level": "Intermediate",
            "duration": "3 Weeks",
            "status": "completed",
            "progress": 100
        }},
        {{
            "skill": "Machine Learning",
            "level": "Intermediate",
            "duration": "5 Weeks",
            "status": "in_progress",
            "progress": 65
        }},
        {{
            "skill": "Deep Learning",
            "level": "Advanced",
            "duration": "4 Weeks",
            "status": "pending",
            "progress": 0
        }},
        {{
            "skill": "MLOps",
            "level": "Advanced",
            "duration": "3 Weeks",
            "status": "pending",
            "progress": 0
        }},
        {{
            "skill": "System Design",
            "level": "Advanced",
            "duration": "2 Weeks",
            "status": "pending",
            "progress": 0
        }}
    ]
}}
"""

    return generate_json(prompt)