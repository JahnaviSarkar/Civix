from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

class ResolutionCreate(BaseModel):
    resolution_image_url: Optional[str] = Field(None, alias="after_image_url")
    after_image_url: Optional[str] = None
    after_img_url: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)

    def get_image_url(self) -> str:
        return self.resolution_image_url or self.after_image_url or self.after_img_url or "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80"

class VerificationRequest(BaseModel):
    accepted: bool
    rejection_reason: Optional[str] = None

