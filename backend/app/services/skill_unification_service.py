"""
Central "unified skills" pipeline.

CareerLens has exactly TWO sources of a user's skills:

  1. PROFILE  - whatever the student picked in Profile Setup's Skills
                step (components/profile/Skills.jsx), persisted in
                profiles.profile_selected_skills.
  2. RESUME   - whatever was extracted from their CURRENT resume only
                (never accumulated across old resumes), persisted in
                profiles.resume_skills and fully replaced every time a
                new resume is uploaded/replaced.

Everything downstream (Skill Analysis, Career Intelligence, Radar,
Learning Path, Job Recommendations, Placement Drives, Certificate
Recommendations) reads the single merged, deduplicated,
technical-skills-only list this module writes into profiles.skills -
that column is kept as the backward-compatible "unified skills" field
every existing consumer already reads, so nothing downstream needs to
change to benefit from this.

build_unified_skills() is the one place this merge happens. It is
called from:
  - routes/profile.py (create_profile)      - profile-selected changed
  - routes/resume.py (upload_resume)        - resume changed
  - routes/settings.py (replace_resume)     - via upload_resume() reuse

Do NOT reimplement this merge anywhere else.
"""

import json
import re

from app.database.db import supabase

# ---------------------------------------------------------------------
# Soft skills - excluded from the TECHNICAL skill set (Skill Analysis
# cards, percentages, radar) per product spec. They are never deleted
# from wherever the user/resume actually put them (profile_selected /
# resume_skills keep the raw picks), only excluded from the derived
# technical `skills` unification used for scoring/matching/radar.
# ---------------------------------------------------------------------
SOFT_SKILLS = {
    "communication", "teamwork", "leadership", "problem solving",
    "time management", "adaptability", "critical thinking", "creativity",
    "presentation", "presentation skills", "interpersonal skills",
    "collaboration", "work ethic", "attention to detail",
    "conflict resolution", "decision making", "emotional intelligence",
    "flexibility", "public speaking", "negotiation", "self motivation",
    "self-motivation", "organization", "organizational skills",
    "multitasking", "active listening", "team player", "team management",
    "mentoring", "stress management", "analytical thinking",
    "strategic thinking", "customer service", "creativity and innovation",
    "interpersonal communication",
}

# Common technology name variants -> canonical display form. Anything
# not listed falls back to a Title Case normalization. Keys are
# matched case-insensitively after collapsing whitespace.
_CANONICAL_SKILL_NAMES = {
    "python": "Python", "java": "Java", "c": "C", "c++": "C++", "cpp": "C++",
    "c#": "C#", "csharp": "C#",
    "javascript": "JavaScript", "js": "JavaScript",
    "typescript": "TypeScript", "ts": "TypeScript",
    "react": "React", "react.js": "React", "reactjs": "React",
    "node": "Node.js", "node.js": "Node.js", "nodejs": "Node.js",
    "express": "Express", "express.js": "Express", "expressjs": "Express",
    "fastapi": "FastAPI", "flask": "Flask", "django": "Django",
    "sql": "SQL", "mysql": "MySQL", "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL", "mongodb": "MongoDB", "mongo": "MongoDB",
    "sqlite": "SQLite",
    "tensorflow": "TensorFlow", "pytorch": "PyTorch",
    "machine learning": "Machine Learning", "ml": "Machine Learning",
    "deep learning": "Deep Learning", "dl": "Deep Learning",
    "nlp": "NLP", "computer vision": "Computer Vision", "cv": "Computer Vision",
    "git": "Git", "github": "GitHub", "gitlab": "GitLab",
    "docker": "Docker", "kubernetes": "Kubernetes", "k8s": "Kubernetes",
    "aws": "AWS", "azure": "Azure", "gcp": "GCP", "google cloud": "GCP",
    "html": "HTML", "html5": "HTML", "css": "CSS", "css3": "CSS",
    "tailwind": "Tailwind CSS", "tailwind css": "Tailwind CSS",
    "bootstrap": "Bootstrap",
    "pandas": "Pandas", "numpy": "NumPy", "matplotlib": "Matplotlib",
    "power bi": "Power BI", "powerbi": "Power BI", "excel": "Excel",
    "rest api": "REST API", "rest": "REST API", "restful api": "REST API",
    "graphql": "GraphQL",
    "linux": "Linux", "vs code": "VS Code", "vscode": "VS Code",
    "postman": "Postman", "redux": "Redux",
    "next.js": "Next.js", "nextjs": "Next.js",
    "vue": "Vue.js", "vue.js": "Vue.js", "angular": "Angular",
    "spring": "Spring", "spring boot": "Spring Boot",
    ".net": ".NET", "dotnet": ".NET",
    "r": "R", "scala": "Scala", "go": "Go", "golang": "Go", "rust": "Rust",
    "php": "PHP", "swift": "Swift", "kotlin": "Kotlin",
    "statistics": "Statistics", "data analysis": "Data Analysis",
    "jenkins": "Jenkins", "terraform": "Terraform", "ansible": "Ansible",
    "ci/cd": "CI/CD", "cicd": "CI/CD", "ci cd": "CI/CD",
    "selenium": "Selenium", "figma": "Figma",
}


def normalize_skill_name(raw) -> str:
    """Canonicalizes casing/naming so 'python'/'Python'/'PYTHON' and
    'javascript'/'Javascript' collapse to one display form, without
    merging genuinely different technologies (Java stays separate from
    JavaScript)."""
    if raw is None:
        return ""
    cleaned = re.sub(r"\s+", " ", str(raw).strip())
    if not cleaned:
        return ""

    key = cleaned.lower()
    if key in _CANONICAL_SKILL_NAMES:
        return _CANONICAL_SKILL_NAMES[key]

    # Short, already-uppercase tokens (SQL, AWS, API...) are almost
    # always acronyms - keep as typed rather than Title Case them.
    if cleaned.isupper() and len(cleaned) <= 5:
        return cleaned

    return " ".join(
        word if word.isupper() else word.capitalize()
        for word in cleaned.split(" ")
    )


def is_soft_skill(skill) -> bool:
    key = re.sub(r"\s+", " ", str(skill or "").strip().lower())
    return key in SOFT_SKILLS


def dedupe_normalize(skills, drop_soft: bool = False):
    """Case-insensitive, order-preserving dedup + normalization. When
    drop_soft is True, generic soft skills are excluded entirely -
    used for the TECHNICAL skill set (Skill Analysis / radar /
    matching), never for raw profile_selected_skills / resume_skills
    bookkeeping, which keep whatever was actually picked/extracted."""
    seen = {}
    result = []
    for raw in (skills or []):
        if raw is None:
            continue
        text = str(raw).strip()
        if not text:
            continue
        if drop_soft and is_soft_skill(text):
            continue
        name = normalize_skill_name(text)
        if not name:
            continue
        key = name.lower()
        if key not in seen:
            seen[key] = name
            result.append(name)
    return result


def _load_list_field(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, list) else []
        except Exception:
            return []
    return []


def build_unified_skills(email: str, resume_skills=None) -> dict:
    """
    Recomputes and persists the unified technical skill set for one
    user from whatever is currently the source of truth for each side:

      profile_selected_skills (jsonb) - untouched here, only read.
      resume_skills            (jsonb) - overwritten with `resume_skills`
                                          when explicitly provided (a
                                          new/replaced resume just ran);
                                          otherwise the existing stored
                                          value is reused unchanged.

    Writes back:
      profiles.profile_skills  - profile_selected_skills, deduped,
                                  normalized, soft skills dropped.
      profiles.resume_skills   - the CURRENT resume's skills only,
                                  deduped, normalized, soft skills
                                  dropped (never accumulated across old
                                  resumes - a full replace, not a merge).
      profiles.skill_sources   - {skill: "profile" | "resume" | "both"}
      profiles.skills          - profile_skills ∪ resume_skills,
                                  deduped, order-preserving (profile
                                  skills first) - the backward-compatible
                                  "unified skills" field every existing
                                  downstream consumer already reads.

    Safe to call any number of times; purely deterministic given the
    two source columns.
    """
    response = (
        supabase
        .table("profiles")
        .select("profile_selected_skills, resume_skills")
        .eq("email", email)
        .maybe_single()
        .execute()
    )
    row = (response.data if response else None) or {}

    profile_selected = _load_list_field(row.get("profile_selected_skills"))

    if resume_skills is None:
        resume_skills = _load_list_field(row.get("resume_skills"))

    profile_technical = dedupe_normalize(profile_selected, drop_soft=True)
    resume_technical = dedupe_normalize(resume_skills, drop_soft=True)

    profile_keys = {s.lower() for s in profile_technical}
    resume_keys = {s.lower() for s in resume_technical}

    skill_sources = {}
    for skill in profile_technical:
        skill_sources[skill] = "both" if skill.lower() in resume_keys else "profile"
    for skill in resume_technical:
        if skill.lower() not in profile_keys:
            skill_sources[skill] = "resume"

    unified = dedupe_normalize(profile_technical + resume_technical, drop_soft=True)

    update_payload = {
        "profile_skills": profile_technical,
        "resume_skills": resume_technical,
        "skill_sources": skill_sources,
        "skills": json.dumps(unified),
    }

    supabase.table("profiles").update(update_payload).eq("email", email).execute()

    return {
        "unified_skills": unified,
        "profile_skills": profile_technical,
        "resume_skills": resume_technical,
        "skill_sources": skill_sources,
    }
