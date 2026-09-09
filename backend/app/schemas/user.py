from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from app.models.user import UserRole

EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"

class UserBase(BaseModel):
    name: str
    email: str = Field(..., pattern=EMAIL_REGEX, description="User email address")
    role: UserRole = UserRole.CITIZEN

class UserCreate(UserBase):
    firebase_uid: str

class UserSync(BaseModel):
    name: Optional[str] = "Civix User"
    email: str = Field(..., pattern=EMAIL_REGEX, description="User email address")
    role: UserRole = UserRole.CITIZEN

class UserResponse(UserBase):
    id: int
    firebase_uid: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

