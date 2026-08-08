from pydantic import BaseModel, Field


class UpdateProgressRequest(BaseModel):
    email: str
    progress_percent: int = Field(..., ge=0, le=100, description="Any whole value 0-100")
