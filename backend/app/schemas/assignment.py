from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class AssignmentCreate(BaseModel):
    crew_id: int
    complaint_id: Optional[int] = None


class AssignmentResponse(BaseModel):
    id: int
    complaint_id: int
    crew_id: int
    assigned_at: datetime

    model_config = ConfigDict(from_attributes=True)
