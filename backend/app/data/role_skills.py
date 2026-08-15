"""
Deterministic Role -> Top Key Skills lookup.

Used ONLY to pick which skills the Skill Analysis radar chart shows
for a user's TOP CAREER MATCH - see routes/skills.py, which calls
find_role_key_skills(career_analysis["recommended_role"]) after Career
Intelligence has already decided the user's top career, then scores
those skills against the user's real, stored skill_levels.

This is intentionally a plain data lookup, not another Gemini call:
the radar must always agree with whichever role career_analysis
already picked (the single source of truth for "top career" shared by
Learning Path, Job Recommendations, Placement Drives and Certificate
Recommendations - see routes/career.py:generate_career_analysis), and
a second independent AI call has no way to guarantee that agreement.

Keys are matched case-insensitively via find_role_key_skills(), which
also tolerates role names that don't exactly match a key (e.g. "Senior
Backend Developer", "Backend Developer Intern").
"""

ROLE_KEY_SKILLS = {
    "data analyst": ["SQL", "Python", "Statistics", "Power BI", "Excel"],
    "data scientist": ["Python", "Statistics", "Machine Learning", "SQL", "Pandas"],
    "data engineer": ["Python", "SQL", "ETL", "Apache Spark", "Cloud"],
    "business analyst": ["SQL", "Excel", "Data Analysis", "Power BI", "Statistics"],
    "business intelligence analyst": ["SQL", "Power BI", "Data Analysis", "Excel", "ETL"],

    "backend developer": ["Python", "SQL", "REST API", "Database", "Git"],
    "backend engineer": ["Python", "SQL", "REST API", "Database", "Git"],
    "frontend developer": ["JavaScript", "React", "HTML", "CSS", "TypeScript"],
    "frontend engineer": ["JavaScript", "React", "HTML", "CSS", "TypeScript"],
    "full stack developer": ["JavaScript", "React", "Node.js", "SQL", "REST API"],
    "full stack engineer": ["JavaScript", "React", "Node.js", "SQL", "REST API"],
    "web developer": ["JavaScript", "HTML", "CSS", "React", "REST API"],
    "software engineer": ["Python", "Java", "Data Structures", "SQL", "Git"],
    "software developer": ["Python", "Java", "Data Structures", "SQL", "Git"],
    "java developer": ["Java", "Spring Boot", "SQL", "REST API", "Git"],

    "devops engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"],
    "site reliability engineer": ["Kubernetes", "Linux", "AWS", "CI/CD", "Python"],
    "cloud engineer": ["AWS", "Azure", "Docker", "Kubernetes", "Linux"],
    "cloud architect": ["AWS", "Azure", "GCP", "Kubernetes", "Terraform"],

    "machine learning engineer": ["Python", "Machine Learning", "TensorFlow", "PyTorch", "SQL"],
    "ai engineer": ["Python", "Machine Learning", "Deep Learning", "TensorFlow", "NLP"],
    "ai/ml engineer": ["Python", "Machine Learning", "Deep Learning", "TensorFlow", "NLP"],
    "deep learning engineer": ["Python", "Deep Learning", "TensorFlow", "PyTorch", "Machine Learning"],
    "nlp engineer": ["Python", "NLP", "Machine Learning", "Deep Learning", "PyTorch"],

    "mobile app developer": ["Java", "Kotlin", "Swift", "REST API", "Git"],
    "android developer": ["Kotlin", "Java", "REST API", "Git", "SQL"],
    "ios developer": ["Swift", "REST API", "Git", "SQL", "Xcode"],

    "qa engineer": ["Selenium", "Python", "SQL", "Git", "Java"],
    "test engineer": ["Selenium", "Python", "SQL", "Git", "Java"],
    "automation test engineer": ["Selenium", "Python", "Java", "SQL", "Git"],

    "cybersecurity analyst": ["Networking", "Linux", "Python", "Cybersecurity", "Cloud"],
    "security engineer": ["Networking", "Linux", "Python", "Cybersecurity", "Cloud"],
    "network engineer": ["Networking", "Linux", "Cloud", "Python", "Cybersecurity"],

    "database administrator": ["SQL", "PostgreSQL", "MySQL", "Database", "Linux"],
    "data administrator": ["SQL", "PostgreSQL", "MySQL", "Database", "Linux"],

    "ui/ux designer": ["Figma", "HTML", "CSS", "JavaScript", "UI Design"],
    "ux designer": ["Figma", "UI Design", "HTML", "CSS", "JavaScript"],
    "product manager": ["SQL", "Data Analysis", "Excel", "Communication", "Statistics"],

    "systems administrator": ["Linux", "Networking", "Cloud", "Python", "Docker"],
    "game developer": ["C++", "C#", "Git", "Python", "Unity"],
    "blockchain developer": ["Solidity", "Python", "JavaScript", "Git", "Cryptography"],
    "embedded systems engineer": ["C", "C++", "Python", "Git", "Linux"],
}


def find_role_key_skills(role):
    """
    Case-insensitive lookup with graceful fallback for role names that
    don't exactly match a key (an AI-generated recommended_role can be
    phrased as "Senior Backend Developer", "Backend Developer Intern",
    etc). Returns None - never a fixed generic list - when nothing
    reasonable matches; callers should fall back to the student's own
    top-scored technical skills in that case, so the radar still stays
    personalized instead of showing the same 5 skills for everyone.
    """
    if not role:
        return None

    normalized = str(role).strip().lower()
    if not normalized:
        return None

    if normalized in ROLE_KEY_SKILLS:
        return list(ROLE_KEY_SKILLS[normalized])

    # Substring match either direction - handles "Senior X", "X
    # Intern", "Junior X", "Associate X", "X (Remote)", etc.
    for key, skills in ROLE_KEY_SKILLS.items():
        if key in normalized or normalized in key:
            return list(skills)

    # Token-overlap fallback for roles phrased differently but
    # conceptually the same (e.g. "Web Developer (Frontend)").
    normalized_tokens = set(normalized.replace("/", " ").replace("-", " ").split())
    best_key = None
    best_overlap = 0
    for key in ROLE_KEY_SKILLS:
        overlap = len(normalized_tokens & set(key.split()))
        if overlap > best_overlap:
            best_overlap = overlap
            best_key = key

    if best_key:
        return list(ROLE_KEY_SKILLS[best_key])

    return None
