from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any

from app.models.enums import UserRole
from app.schemas.user import UserResponse
from app.schemas.assignment import AssignmentCreate
from app.schemas.resolution import VerificationRequest
from app.schemas.complaint import ComplaintResponse
from app.dependencies.auth import require_admin
from app.services.firestore import FirestoreRepository

router = APIRouter(prefix="/admin", tags=["Admin Console"])

@router.get("/crews", response_model=List[UserResponse])
def list_crew_members(
    current_user: Dict[str, Any] = Depends(require_admin)
):
    return FirestoreRepository.list_users(role=UserRole.CREW.value)

@router.get("/complaints", response_model=List[ComplaintResponse])
def list_admin_complaints(
    current_user: Dict[str, Any] = Depends(require_admin)
):
    return FirestoreRepository.list_complaints()

@router.post("/assign", response_model=ComplaintResponse)
def assign_crew_direct(
    body: AssignmentCreate,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    complaint = FirestoreRepository.get_complaint_by_id(body.complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    crew_user = FirestoreRepository.get_user_by_id(body.crew_id)
    if not crew_user or (crew_user.get("role") or "").lower() != UserRole.CREW.value:
        raise HTTPException(status_code=400, detail="Invalid crew member ID")

    updated = FirestoreRepository.assign_complaint(body.complaint_id, crew_user, notes=None)
    return updated

@router.post("/complaints/{complaint_id}/assign", response_model=ComplaintResponse)
def assign_crew(
    complaint_id: int,
    body: AssignmentCreate,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    body.complaint_id = complaint_id
    return assign_crew_direct(body=body, current_user=current_user)

@router.post("/complaints/{complaint_id}/verify", response_model=ComplaintResponse)
def verify_complaint_resolution(
    complaint_id: int,
    body: VerificationRequest,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    updated = FirestoreRepository.verify_complaint(
        complaint_id=complaint_id,
        accepted=body.accepted,
        rejection_reason=body.rejection_reason
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return updated
