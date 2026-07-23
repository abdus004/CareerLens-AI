from pydantic import BaseModel
from typing import List


class ProfileCreate(BaseModel):
    full_name: str
    email: str
    phone: str
    gender: str
    age: int

    linkedin: str
    github: str

    college: str
    department: str
    degree: str
    year: str
    cgpa: str

    career_goal: List[str]
    skills: List[str]
    interests: List[str]

    resume_url: str = ""