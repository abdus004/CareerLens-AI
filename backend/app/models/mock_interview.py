from typing import List, Optional

from pydantic import BaseModel, Field


class StartInterviewRequest(BaseModel):
    email: str
    interview_type: str = Field(..., description="Technical | HR | Behavioral | Mixed")
    target_role: Optional[str] = Field(
        default=None,
        description="One of the fixed role labels, a custom role (when 'Other' was picked), or None for a General interview.",
    )
    difficulty: str = Field(..., description="Easy | Medium | Hard")
    num_questions: int = Field(..., description="5 | 10 | 15 | 20")


class SaveAnswerRequest(BaseModel):
    question_number: int
    question_id: Optional[str] = None
    question_text: str
    answer_text: str = ""
    time_taken_seconds: int = 0
    skipped: bool = False


class RetakeInterviewRequest(BaseModel):
    email: str