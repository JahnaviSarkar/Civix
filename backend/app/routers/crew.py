from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.complaint import Complaint, ComplaintStatus
from app.models.assignment import Assignment
from app.models.resolution import Resolution
from app.schemas.complaint import ComplaintResponse
from app.schemas.resolution import ResolutionCreate
from app.dependencies.auth import require_crew

router = APIRouter(prefix="/crew", tags=["Crew Operations"])

@router.get("/tasks", response_model=List[ComplaintResponse])
def get_crew_tasks(
    current_user: User = Depends(require_crew),
    db: Session = Depends(get_db)
):
    assignments = db.query(Assignment).filter(Assignment.crew_id == current_user.id).all()
    assigned_ids = [a.complaint_id for a in assignments]

    complaints = db.query(Complaint).options(
        joinedload(Complaint.citizen),
        joinedload(Complaint.assignment),
        joinedload(Complaint.resolution),
        joinedload(Complaint.rating)
    ).filter(
        (Complaint.id.in_(assigned_ids)) |
        (Complaint.status.in_([ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.PENDING]))
    ).order_by(Complaint.updated_at.desc()).all()

    return complaints

@router.patch("/tasks/{complaint_id}/start", response_model=ComplaintResponse)
def start_task(
    complaint_id: int,
    current_user: User = Depends(require_crew),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    assignment = db.query(Assignment).filter(
        Assignment.complaint_id == complaint_id,
        Assignment.crew_id == current_user.id
    ).first()

    if not assignment and current_user.role.value != "admin":
        assignment = Assignment(complaint_id=complaint_id, crew_id=current_user.id)
        db.add(assignment)

    complaint.status = ComplaintStatus.IN_PROGRESS
    db.commit()

    updated_complaint = db.query(Complaint).options(
        joinedload(Complaint.citizen),
        joinedload(Complaint.assignment),
        joinedload(Complaint.resolution),
        joinedload(Complaint.rating)
    ).filter(Complaint.id == complaint_id).first()

    return updated_complaint

@router.post("/tasks/{complaint_id}/resolve", response_model=ComplaintResponse)
@router.post("/resolve/{complaint_id}", response_model=ComplaintResponse)
def resolve_task(
    complaint_id: int,
    body: ResolutionCreate,
    current_user: User = Depends(require_crew),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    assignment = db.query(Assignment).filter(
        Assignment.complaint_id == complaint_id,
        Assignment.crew_id == current_user.id
    ).first()

    if not assignment and current_user.role.value != "admin":
        assignment = Assignment(complaint_id=complaint_id, crew_id=current_user.id)
        db.add(assignment)

    image_url = body.get_image_url()
    existing_res = db.query(Resolution).filter(Resolution.complaint_id == complaint_id).first()
    if existing_res:
        existing_res.resolution_image_url = image_url
        existing_res.notes = body.notes
    else:
        res = Resolution(
            complaint_id=complaint_id,
            crew_id=current_user.id,
            resolution_image_url=image_url,
            notes=body.notes
        )
        db.add(res)

    complaint.status = ComplaintStatus.RESOLVED
    db.commit()

    updated_complaint = db.query(Complaint).options(
        joinedload(Complaint.citizen),
        joinedload(Complaint.assignment),
        joinedload(Complaint.resolution),
        joinedload(Complaint.rating)
    ).filter(Complaint.id == complaint_id).first()

    return updated_complaint

