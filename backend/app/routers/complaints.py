from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from app.models.enums import ComplaintStatus, ComplaintCategory, UserRole
from app.schemas.complaint import ComplaintCreate, ComplaintResponse
from app.schemas.assignment import AssignmentCreate
from app.schemas.resolution import ResolutionCreate, VerificationRequest
from app.schemas.rating import RatingCreate
from app.dependencies.auth import get_current_user, require_citizen, require_crew, require_admin
from app.services.ai_service import analyze_waste_image
from app.services.firestore import FirestoreRepository

router = APIRouter(prefix="/complaints", tags=["Complaints"])

class ComplaintPatch(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ComplaintStatus] = None
    category: Optional[ComplaintCategory] = None

@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(
    body: ComplaintCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    ai_result = {"ai_category": body.category.value if hasattr(body.category, "value") else str(body.category), "ai_confidence": 0.85, "severity": 5.0}
    if body.image_url:
        ai_result = analyze_waste_image(body.image_url)

    payload = {
        "title": body.title,
        "description": body.description,
        "category": body.category.value if hasattr(body.category, "value") else str(body.category),
        "severity": ai_result.get("severity", 5.0),
        "ai_confidence": ai_result.get("ai_confidence"),
        "ai_category": ai_result.get("ai_category"),
        "latitude": body.latitude,
        "longitude": body.longitude,
        "address": body.address,
        "image_url": body.image_url
    }

    complaint = FirestoreRepository.create_complaint(current_user, payload)
    return complaint

@router.get("", response_model=List[ComplaintResponse])
def get_complaints(
    status: Optional[ComplaintStatus] = Query(None),
    category: Optional[ComplaintCategory] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_role = (current_user.get("role") or "citizen").lower()
    citizen_id = current_user["id"] if user_role == UserRole.CITIZEN.value else None

    status_str = status.value if hasattr(status, "value") else (str(status) if status else None)
    category_str = category.value if hasattr(category, "value") else (str(category) if category else None)

    results = FirestoreRepository.list_complaints(
        citizen_id=citizen_id,
        status=status_str,
        category=category_str
    )
    return results

@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    complaint = FirestoreRepository.get_complaint_by_id(complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    user_role = (current_user.get("role") or "citizen").lower()
    if user_role == UserRole.CITIZEN.value and complaint.get("citizen_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this complaint")

    return complaint

@router.patch("/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(
    complaint_id: int,
    body: ComplaintPatch,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    complaint = FirestoreRepository.get_complaint_by_id(complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    user_role = (current_user.get("role") or "citizen").lower()
    if user_role == UserRole.CITIZEN.value and complaint.get("citizen_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to modify this complaint")

    updates = {}
    if body.title is not None:
        updates["title"] = body.title
    if body.description is not None:
        updates["description"] = body.description
    if body.category is not None:
        updates["category"] = body.category.value if hasattr(body.category, "value") else str(body.category)
    if body.status is not None:
        st_val = body.status.value if hasattr(body.status, "value") else str(body.status)
        if user_role == UserRole.CITIZEN.value and st_val == ComplaintStatus.CANCELLED.value:
            updates["status"] = ComplaintStatus.CANCELLED.value
        elif user_role in [UserRole.ADMIN.value, UserRole.CREW.value]:
            updates["status"] = st_val

    updated = FirestoreRepository.update_complaint(complaint_id, updates)
    return updated

@router.post("/{complaint_id}/assign", response_model=ComplaintResponse)
def assign_complaint_to_crew(
    complaint_id: int,
    body: AssignmentCreate,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    crew_user = FirestoreRepository.get_user_by_id(body.crew_id)
    if not crew_user or (crew_user.get("role") or "").lower() != UserRole.CREW.value:
        raise HTTPException(status_code=400, detail="Invalid crew member ID")

    updated = FirestoreRepository.assign_complaint(complaint_id, crew_user, notes=None)
    if not updated:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return updated

@router.post("/{complaint_id}/resolve", response_model=ComplaintResponse)
def resolve_complaint_task(
    complaint_id: int,
    body: ResolutionCreate,
    current_user: Dict[str, Any] = Depends(require_crew)
):
    img_url = body.get_image_url()
    updated = FirestoreRepository.resolve_complaint(
        complaint_id=complaint_id,
        crew_id=current_user["id"],
        notes=body.notes,
        after_image_url=img_url
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return updated

@router.post("/{complaint_id}/verify", response_model=ComplaintResponse)
def verify_complaint(
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

@router.post("/{complaint_id}/rate", response_model=ComplaintResponse)
def rate_complaint(
    complaint_id: int,
    body: RatingCreate,
    current_user: Dict[str, Any] = Depends(require_citizen)
):
    complaint = FirestoreRepository.get_complaint_by_id(complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if complaint.get("citizen_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only rate your own complaints")

    if complaint.get("status") != ComplaintStatus.VERIFIED.value:
        raise HTTPException(status_code=400, detail="Only verified complaints can be rated")

    updated = FirestoreRepository.rate_complaint(
        complaint_id=complaint_id,
        citizen_id=current_user["id"],
        score=body.score,
        feedback=body.feedback
    )
    return updated
