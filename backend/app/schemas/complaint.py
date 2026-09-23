from pydantic import BaseModel, ConfigDict, Field, computed_field
from datetime import datetime
from typing import Optional, Union, Any
from app.models.complaint import ComplaintStatus, ComplaintCategory
from app.schemas.user import UserResponse

class ComplaintBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=5)
    category: ComplaintCategory = ComplaintCategory.GARBAGE_COLLECTION
    latitude: float
    longitude: float
    address: Optional[str] = None
    image_url: Optional[str] = None

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdateStatus(BaseModel):
    status: ComplaintStatus

class ResolutionResponse(BaseModel):
    id: int
    complaint_id: int
    crew_id: int
    resolution_image_url: str
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    resolved_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def after_image_url(self) -> str:
        return self.resolution_image_url

class RatingResponse(BaseModel):
    id: int
    complaint_id: int
    score: int
    feedback: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ComplaintResponse(BaseModel):
    id: Union[int, str, None] = 0
    citizen_id: Union[int, str, None] = 1
    title: Optional[str] = "Waste Complaint"
    description: Optional[str] = "No description provided."
    category: Union[ComplaintCategory, str, None] = ComplaintCategory.GARBAGE_COLLECTION
    latitude: Optional[float] = 12.97159
    longitude: Optional[float] = 77.59456
    address: Optional[str] = None
    image_url: Optional[str] = None
    severity: Optional[float] = 5.0
    ai_confidence: Optional[float] = None
    ai_category: Optional[str] = None
    status: Union[ComplaintStatus, str, None] = ComplaintStatus.PENDING
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    citizen: Optional[UserResponse] = None
    assigned_crew: Optional[UserResponse] = None
    resolution: Optional[ResolutionResponse] = None
    rating: Optional[RatingResponse] = None

    model_config = ConfigDict(from_attributes=True)

