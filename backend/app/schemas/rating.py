from pydantic import BaseModel, Field
from typing import Optional

class RatingCreate(BaseModel):
    score: int = Field(..., ge=1, le=5)
    feedback: Optional[str] = None
