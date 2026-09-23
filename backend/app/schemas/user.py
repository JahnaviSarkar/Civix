from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from app.models.user import UserRole

EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"

class UserBase(BaseModel):
    name: Optional[str] = "Civix User"
    email: str = Field(..., description="User email address")
    role: UserRole = UserRole.CITIZEN

class UserCreate(UserBase):
    firebase_uid: str

class UserSync(BaseModel):
    name: Optional[str] = "Civix User"
    email: str = Field(..., description="User email address")
    role: UserRole = UserRole.CITIZEN

class UserResponse(BaseModel):
    id: Optional[int] = 1
    firebase_uid: Optional[str] = ""
    name: Optional[str] = "Civix User"
    email: Optional[str] = "user@smartwaste.local"
    role: Optional[UserRole] = UserRole.CITIZEN
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


