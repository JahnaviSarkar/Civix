from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.database import get_db
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintStatus
from app.models.assignment import Assignment
from app.models.resolution import Resolution
from app.schemas.user import UserResponse
from app.schemas.assignment import AssignmentCreate
from app.schemas.resolution import VerificationRequest
from app.schemas.complaint import ComplaintResponse
from app.dependencies.auth import require_admin

router = APIRouter(prefix="/admin", tags=["Admin Console"])

@router.get("/crews", response_model=List[UserResponse])
def list_crew_members(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(User).filter(User.role == UserRole.CREW).all()

@router.get("/complaints", response_model=List[ComplaintResponse])
def list_admin_complaints(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(Complaint).options(
        joinedload(Complaint.citizen),
        joinedload(Complaint.assignment),
        joinedload(Complaint.resolution),
        joinedload(Complaint.rating)
    ).order_by(Complaint.updated_at.desc()).all()

@router.post("/assign", response_model=ComplaintResponse)
def assign_crew_direct(
    body: AssignmentCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == body.complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    crew_user = db.query(User).filter(User.id == body.crew_id, User.role == UserRole.CREW).first()
    if not crew_user:
        raise HTTPException(status_code=400, detail="Invalid crew member ID")

    existing_assignment = db.query(Assignment).filter(Assignment.complaint_id == body.complaint_id).first()
    if existing_assignment:
        existing_assignment.crew_id = body.crew_id
    else:
        assignment = Assignment(complaint_id=body.complaint_id, crew_id=body.crew_id)
        db.add(assignment)

    complaint.status = ComplaintStatus.ASSIGNED
    db.commit()
    
    updated_complaint = db.query(Complaint).options(
        joinedload(Complaint.citizen),
        joinedload(Complaint.assignment),
        joinedload(Complaint.resolution),
        joinedload(Complaint.rating)
    ).filter(Complaint.id == body.complaint_id).first()

    return updated_complaint

@router.post("/complaints/{complaint_id}/assign", response_model=ComplaintResponse)
def assign_crew(
    complaint_id: int,
    body: AssignmentCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    body.complaint_id = complaint_id
    return assign_crew_direct(body=body, current_user=current_user, db=db)

@router.post("/complaints/{complaint_id}/verify", response_model=ComplaintResponse)
def verify_complaint_resolution(
    complaint_id: int,
    body: VerificationRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if body.accepted:
        complaint.status = ComplaintStatus.VERIFIED
    else:
        complaint.status = ComplaintStatus.REJECTED
        resolution = db.query(Resolution).filter(Resolution.complaint_id == complaint_id).first()
        if resolution:
            resolution.rejection_reason = body.rejection_reason or "Resolution rejected by admin"

    db.commit()

    updated_complaint = db.query(Complaint).options(
        joinedload(Complaint.citizen),
        joinedload(Complaint.assignment),
        joinedload(Complaint.resolution),
        joinedload(Complaint.rating)
    ).filter(Complaint.id == complaint_id).first()

    return updated_complaint

