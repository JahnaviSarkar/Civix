from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserSync
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/sync", response_model=UserResponse)
def sync_user(
    body: UserSync,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.name = body.name or current_user.name
    current_user.role = body.role
    db.commit()
    db.refresh(current_user)
    return current_user
