from typing import Optional

from pydantic import BaseModel, Field


class StartAssessmentRequest(BaseModel):
    email: str
    category: str = Field(..., description="Programming | Aptitude | Reasoning | SQL | Python | Java | AI/ML")
    difficulty: str = Field(..., description="Easy | Medium | Hard")
    num_questions: int = Field(..., description="10 | 15 | 20")


class SaveAssessmentAnswerRequest(BaseModel):
    question_number: int
    question_id: Optional[str] = None
    selected_option: Optional[str] = Field(default=None, description="A | B | C | D | null")
    skipped: bool = False


class RetakeAssessmentRequest(BaseModel):
    email: str


class GenerateCertificateRequest(BaseModel):
    email: str
