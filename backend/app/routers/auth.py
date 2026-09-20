from fastapi import APIRouter, Depends
from typing import Dict, Any
from app.schemas.user import UserResponse, UserSync
from app.dependencies.auth import get_current_user
from app.services.firestore import FirestoreRepository

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/me", response_model=UserResponse)
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return current_user

@router.post("/sync", response_model=UserResponse)
def sync_user(
    body: UserSync,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    # Security: Only update user profile metadata (name).
    # NEVER allow users to self-assign role via /api/auth/sync request payload.
    if body.name and body.name.strip():
        updated = FirestoreRepository.update_user_name(current_user["firebase_uid"], body.name.strip())
        if updated:
            return updated

    return current_user
