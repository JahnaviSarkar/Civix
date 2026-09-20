from fastapi import APIRouter, Depends
from typing import List, Dict, Any

from app.schemas.user import UserResponse
from app.dependencies.auth import require_admin
from app.services.firestore import FirestoreRepository

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserResponse])
def get_all_users(
    current_user: Dict[str, Any] = Depends(require_admin)
):
    return FirestoreRepository.list_users()
