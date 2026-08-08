"""
Expands the `jobs` table (Job Master database backing Job
Recommendations - see routes/jobs.py + services/job_matching_service.py)
with a large, realistic set of listings across common tech roles.

Unlike placement_drives (which sync live from Greenhouse/Lever - see
services/job_sources/), the `jobs` table has no live external feed, so
this script is the seed data source for it, following the exact same
pattern as scripts/seed_question_bank.py: a structured, readable Python
list instead of one giant SQL INSERT block.

Run manually, once (and again any time you want to top up the pool):

    cd backend
    python -m scripts.seed_jobs

Safe to re-run: skips any (company_name, role_title, location) combo
that already exists instead of inserting duplicates.
"""

from app.database.db import supabase

# ---------------------------------------------------------------------
# Per-role-category skill stacks, descriptions and salary/experience
# bands. Companies are combined with these below to generate a large,
# varied, but still realistic set of listings - no company_logo_url is
# set for any of them (left as null), so every card renders through
# the existing Building2 fallback icon rather than depending on
# fragile third-party logo URLs (Clearbit or otherwise).
# ---------------------------------------------------------------------

ROLE_TEMPLATES = [
    {
        "role_title": "Software Engineer",
        "role_category": "Software Engineering",
        "skills": ["Java", "Python", "Data Structures", "Algorithms", "Git", "SQL"],
        "departments": ["Computer Science", "Information Technology"],
        "description": "Design, build, and maintain scalable backend and full-stack features as part of a cross-functional engineering team, from design review through production rollout.",
        "job_type": "Full Time",
        "experience_min": 0, "experience_max": 2, "experience_display": "0-2 years",
        "salary_min": 600000, "salary_max": 1200000, "salary_display": "₹6L - ₹12L PA",
        "min_cgpa": 6.5,
    },
    {
        "role_title": "Backend Developer",
        "role_category": "Software Engineering",
        "skills": ["Python", "FastAPI", "Node.js", "PostgreSQL", "REST APIs", "Docker"],
        "departments": ["Computer Science", "Information Technology"],
        "description": "Own backend services and APIs that power our core product, focusing on reliability, data modeling, and clean service boundaries.",
        "job_type": "Full Time",
        "experience_min": 1, "experience_max": 3, "experience_display": "1-3 years",
        "salary_min": 700000, "salary_max": 1400000, "salary_display": "₹7L - ₹14L PA",
        "min_cgpa": 6.5,
    },
    {
        "role_title": "Frontend Developer",
        "role_category": "Software Engineering",
        "skills": ["React", "JavaScript", "TypeScript", "HTML", "CSS", "Tailwind CSS"],
        "departments": ["Computer Science", "Information Technology"],
        "description": "Build responsive, accessible user interfaces and component libraries, working closely with design and product to ship polished experiences.",
        "job_type": "Full Time",
        "experience_min": 0, "experience_max": 2, "experience_display": "0-2 years",
        "salary_min": 600000, "salary_max": 1100000, "salary_display": "₹6L - ₹11L PA",
        "min_cgpa": 6.0,
    },
    {
        "role_title": "Full Stack Developer",
        "role_category": "Software Engineering",
        "skills": ["React", "Node.js", "MongoDB", "Express.js", "JavaScript", "REST APIs"],
        "departments": ["Computer Science", "Information Technology"],
        "description": "Work across the entire stack - from database schema to UI - to ship end-to-end features for our web application.",
        "job_type": "Full Time",
        "experience_min": 1, "experience_max": 3, "experience_display": "1-3 years",
        "salary_min": 700000, "salary_max": 1500000, "salary_display": "₹7L - ₹15L PA",
        "min_cgpa": 6.5,
    },
    {
        "role_title": "Data Analyst",
        "role_category": "Data & Analytics",
        "skills": ["SQL", "Excel", "Python", "Power BI", "Tableau", "Statistics"],
        "departments": ["Computer Science", "Statistics", "Information Technology"],
        "description": "Turn raw business data into clear dashboards and insights, partnering with stakeholders to answer key product and operations questions.",
        "job_type": "Full Time",
        "experience_min": 0, "experience_max": 2, "experience_display": "0-2 years",
        "salary_min": 500000, "salary_max": 1000000, "salary_display": "₹5L - ₹10L PA",
        "min_cgpa": 6.0,
    },
    {
        "role_title": "Data Scientist",
        "role_category": "Data & Analytics",
        "skills": ["Python", "Machine Learning", "Pandas", "SQL", "Statistics", "Scikit-learn"],
        "departments": ["Computer Science", "Statistics", "Data Science"],
        "description": "Build predictive models and experiments that directly inform product decisions, from problem framing through to deployed model monitoring.",
        "job_type": "Full Time",
        "experience_min": 1, "experience_max": 4, "experience_display": "1-4 years",
        "salary_min": 900000, "salary_max": 1800000, "salary_display": "₹9L - ₹18L PA",
        "min_cgpa": 7.0,
    },
    {
        "role_title": "ML Engineer",
        "role_category": "Artificial Intelligence",
        "skills": ["Python", "TensorFlow", "PyTorch", "Machine Learning", "MLOps", "Docker"],
        "departments": ["Computer Science", "Data Science", "Artificial Intelligence"],
        "description": "Take machine learning models from notebook to production - building training pipelines, serving infrastructure, and monitoring for drift.",
        "job_type": "Full Time",
        "experience_min": 1, "experience_max": 4, "experience_display": "1-4 years",
        "salary_min": 1000000, "salary_max": 2000000, "salary_display": "₹10L - ₹20L PA",
        "min_cgpa": 7.0,
    },
    {
        "role_title": "AI Engineer",
        "role_category": "Artificial Intelligence",
        "skills": ["Python", "LLMs", "Deep Learning", "PyTorch", "NLP", "Prompt Engineering"],
        "departments": ["Computer Science", "Data Science", "Artificial Intelligence"],
        "description": "Design and ship AI-powered product features, integrating and fine-tuning modern models while keeping latency and cost in check.",
        "job_type": "Full Time",
        "experience_min": 1, "experience_max": 4, "experience_display": "1-4 years",
        "salary_min": 1100000, "salary_max": 2200000, "salary_display": "₹11L - ₹22L PA",
        "min_cgpa": 7.0,
    },
    {
        "role_title": "Cloud Engineer",
        "role_category": "Cloud & Infrastructure",
        "skills": ["AWS", "Azure", "Terraform", "Linux", "Networking", "CI/CD"],
        "departments": ["Computer Science", "Information Technology"],
        "description": "Design and maintain cloud infrastructure that's secure, cost-efficient, and scales with the business, using infrastructure-as-code throughout.",
        "job_type": "Full Time",
        "experience_min": 1, "experience_max": 4, "experience_display": "1-4 years",
        "salary_min": 800000, "salary_max": 1700000, "salary_display": "₹8L - ₹17L PA",
        "min_cgpa": 6.5,
    },
    {
        "role_title": "DevOps Engineer",
        "role_category": "Cloud & Infrastructure",
        "skills": ["Docker", "Kubernetes", "CI/CD", "AWS", "Linux", "Terraform"],
        "departments": ["Computer Science", "Information Technology"],
        "description": "Build and operate CI/CD pipelines, container platforms, and observability tooling that keep releases fast and systems reliable.",
        "job_type": "Full Time",
        "experience_min": 1, "experience_max": 4, "experience_display": "1-4 years",
        "salary_min": 800000, "salary_max": 1700000, "salary_display": "₹8L - ₹17L PA",
        "min_cgpa": 6.5,
    },
    {
        "role_title": "Cybersecurity Analyst",
        "role_category": "Security",
        "skills": ["Network Security", "SIEM", "Penetration Testing", "Linux", "Python", "Incident Response"],
        "departments": ["Computer Science", "Information Technology", "Cybersecurity"],
        "description": "Monitor, detect, and respond to security threats across our infrastructure, and help harden systems against emerging vulnerabilities.",
        "job_type": "Full Time",
        "experience_min": 1, "experience_max": 3, "experience_display": "1-3 years",
        "salary_min": 700000, "salary_max": 1500000, "salary_display": "₹7L - ₹15L PA",
        "min_cgpa": 6.5,
    },
    {
        "role_title": "Database Developer",
        "role_category": "Data & Analytics",
        "skills": ["SQL", "PostgreSQL", "MySQL", "Database Design", "Query Optimization", "Python"],
        "departments": ["Computer Science", "Information Technology"],
        "description": "Design efficient schemas, write and tune complex queries, and support application teams with reliable, well-indexed data access.",
        "job_type": "Full Time",
        "experience_min": 1, "experience_max": 3, "experience_display": "1-3 years",
        "salary_min": 600000, "salary_max": 1300000, "salary_display": "₹6L - ₹13L PA",
        "min_cgpa": 6.0,
    },
    {
        "role_title": "Business Analyst",
        "role_category": "Business & Product",
        "skills": ["Excel", "SQL", "Communication", "Requirements Gathering", "Power BI", "Agile"],
        "departments": ["Computer Science", "Business Administration", "Information Technology"],
        "description": "Bridge business needs and technical delivery - gathering requirements, documenting processes, and tracking outcomes with data.",
        "job_type": "Full Time",
        "experience_min": 0, "experience_max": 2, "experience_display": "0-2 years",
        "salary_min": 500000, "salary_max": 1000000, "salary_display": "₹5L - ₹10L PA",
        "min_cgpa": 6.0,
    },
    {
        "role_title": "QA Engineer",
        "role_category": "Software Engineering",
        "skills": ["Selenium", "Manual Testing", "Test Automation", "Python", "API Testing", "Agile"],
        "departments": ["Computer Science", "Information Technology"],
        "description": "Design test plans and automation suites that catch regressions early, and partner with engineers to raise overall product quality.",
        "job_type": "Full Time",
        "experience_min": 0, "experience_max": 2, "experience_display": "0-2 years",
        "salary_min": 500000, "salary_max": 1000000, "salary_display": "₹5L - ₹10L PA",
        "min_cgpa": 6.0,
    },
]

COMPANIES = [
    "Infosys", "TCS", "Wipro", "HCLTech", "Tech Mahindra", "Capgemini",
    "Accenture", "Cognizant", "IBM India", "Oracle India", "SAP Labs India",
    "Microsoft India", "Amazon India", "Google India", "Adobe India",
    "Flipkart", "Swiggy", "Zomato", "Paytm", "PhonePe", "Razorpay",
    "Freshworks", "Zoho", "Postman", "BrowserStack", "Chargebee",
    "Myntra", "Ola", "Meesho", "CRED", "Groww", "Zerodha",
    "Deloitte India", "PwC India", "EY India", "KPMG India",
    "LTIMindtree", "Mphasis", "Persistent Systems", "Mindtree", "Hexaware",
    "ThoughtWorks", "Publicis Sapient", "Nagarro", "Coforge",
    "Salesforce India", "VMware India", "Cisco India", "Intel India",
    "Nvidia India", "Qualcomm India", "Samsung R&D India", "Juniper Networks",
]

LOCATIONS = [
    "Bangalore", "Hyderabad", "Pune", "Chennai", "Gurgaon", "Noida",
    "Mumbai", "Kolkata", "Remote", "Bangalore (Hybrid)", "Pune (Hybrid)",
]


def _generate_rows():
    rows = []
    loc_i = 0
    for template in ROLE_TEMPLATES:
        # ~5 companies per role template keeps the pool large and
        # varied (14 templates x 5 = 70 rows) without hand-authoring
        # each one individually.
        for i in range(5):
            company = COMPANIES[(ROLE_TEMPLATES.index(template) * 5 + i) % len(COMPANIES)]
            location = LOCATIONS[loc_i % len(LOCATIONS)]
            loc_i += 1

            rows.append({
                "company_name": company,
                "company_logo_url": None,
                "role_title": template["role_title"],
                "role_category": template["role_category"],
                "description": f"{template['description']} ({company})",
                "required_skills": template["skills"],
                "preferred_departments": template["departments"],
                "min_cgpa": template["min_cgpa"],
                "location": location,
                "salary_display": template["salary_display"],
                "salary_min": template["salary_min"],
                "salary_max": template["salary_max"],
                "experience_display": template["experience_display"],
                "experience_min": template["experience_min"],
                "experience_max": template["experience_max"],
                "job_type": template["job_type"],
                "apply_url": f"https://careers.{company.lower().replace(' ', '').replace('.', '')}.com/jobs",
                "is_active": True,
            })
    return rows


def seed():
    rows = _generate_rows()

    # De-duplicate the generated rows themselves against (company_name,
    # role_title) - the same pair that "Cognizant" / "Backend Developer"
    # collided on) BEFORE touching the database, since the live table
    # enforces a UNIQUE(company_name, role_title) constraint (this
    # wasn't visible in the original schema dump, but the actual table
    # has it - jobs_company_role_key).
    deduped_rows = {}
    for r in rows:
        key = (r["company_name"], r["role_title"])
        deduped_rows[key] = r  # last one wins if templates ever collide
    rows = list(deduped_rows.values())

    # upsert (not insert): even though the check above already avoids
    # sending known duplicates, upserting against the real constraint
    # makes this script safe to re-run at any time, from any partial
    # state, without ever hard-failing the whole batch over one
    # already-existing (company, role) pair.
    result = (
        supabase.table("jobs")
        .upsert(rows, on_conflict="company_name,role_title")
        .execute()
    )
    print(f"Upserted {len(result.data or rows)} jobs (inserted new + refreshed any that already existed).")


if __name__ == "__main__":
    seed()