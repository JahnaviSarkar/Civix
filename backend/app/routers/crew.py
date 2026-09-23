from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any

from app.models.enums import ComplaintStatus
from app.schemas.complaint import ComplaintResponse
from app.schemas.resolution import ResolutionCreate
from app.dependencies.auth import require_crew
from app.services.firestore import FirestoreRepository

router = APIRouter(prefix="/crew", tags=["Crew Operations"])

@router.get("/tasks", response_model=List[ComplaintResponse])
def get_crew_tasks(
    current_user: Dict[str, Any] = Depends(require_crew)
):
    complaints = FirestoreRepository.list_complaints()
    crew_id = current_user["id"]
    user_role = (current_user.get("role") or "").lower()

    filtered = []
    for c in complaints:
        is_assigned_to_me = (c.get("assigned_crew_id") == crew_id)
        is_open = c.get("status") in [ComplaintStatus.ASSIGNED.value, ComplaintStatus.IN_PROGRESS.value, ComplaintStatus.PENDING.value]
        if is_assigned_to_me or is_open or user_role == "admin":
            filtered.append(c)

    return filtered

@router.patch("/tasks/{complaint_id}/start", response_model=ComplaintResponse)
def start_task(
    complaint_id: int,
    current_user: Dict[str, Any] = Depends(require_crew)
):
    complaint = FirestoreRepository.get_complaint_by_id(complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    updates = {
        "status": ComplaintStatus.IN_PROGRESS.value,
        "assigned_crew_id": current_user["id"],
        "assigned_crew": {
            "id": current_user.get("id", 2),
            "firebase_uid": current_user.get("firebase_uid", "crew_uid"),
            "name": current_user.get("name", "Crew Team"),
            "email": current_user.get("email", "crew@smartwaste.local"),
            "role": current_user.get("role", "crew"),
            "created_at": current_user.get("created_at", "")
        }
    }

    updated = FirestoreRepository.update_complaint(complaint_id, updates)
    return updated

@router.post("/tasks/{complaint_id}/resolve", response_model=ComplaintResponse)
@router.post("/resolve/{complaint_id}", response_model=ComplaintResponse)
def resolve_task(
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
