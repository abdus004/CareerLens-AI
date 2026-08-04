from pydantic import BaseModel, Field


class UpdateProgressRequest(BaseModel):
    email: str
    progress_percent: int = Field(..., description="0 | 25 | 50 | 75 | 100")
