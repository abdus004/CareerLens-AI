import fitz
import re


def extract_text(pdf_path):
    doc = fitz.open(pdf_path)

    text = ""

    for page in doc:
        text += page.get_text()

    doc.close()

    return text


def extract_skills(text):

    skills_db = [
        "Python",
        "Java",
        "C",
        "C++",
        "JavaScript",
        "TypeScript",
        "React",
        "Node.js",
        "Express",
        "FastAPI",
        "Flask",
        "Django",
        "SQL",
        "MySQL",
        "PostgreSQL",
        "MongoDB",
        "TensorFlow",
        "PyTorch",
        "Machine Learning",
        "Deep Learning",
        "Git",
        "GitHub",
        "Docker",
        "AWS",
        "Azure",
        "HTML",
        "CSS",
        "Tailwind",
        "Pandas",
        "NumPy",
        "Matplotlib"
    ]

    found = []

    lower_text = text.lower()

    for skill in skills_db:

        if skill.lower() in lower_text:
            found.append(skill)

    return sorted(list(set(found)))