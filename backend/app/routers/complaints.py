from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintStatus, ComplaintCategory
from app.models.assignment import Assignment
from app.models.resolution import Resolution
from app.models.rating import Rating
from app.schemas.complaint import ComplaintCreate, ComplaintResponse
from app.schemas.assignment import AssignmentCreate
from app.schemas.resolution import ResolutionCreate, VerificationRequest
from app.schemas.rating import RatingCreate
from app.dependencies.auth import get_current_user, require_citizen, require_crew, require_admin
from app.services.ai_service import analyze_waste_image

router = APIRouter(prefix="/complaints", tags=["Complaints"])

class ComplaintPatch(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ComplaintStatus] = None
    category: Optional[ComplaintCategory] = None

@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(
    body: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ai_result = {"ai_category": body.category.value, "ai_confidence": 0.85, "severity": 5.0}
    if body.image_url:
        ai_result = analyze_waste_image(body.image_url)

    complaint = Complaint(
        citizen_id=current_user.id,
        title=body.title,
        description=body.description,
        category=body.category,
        severity=ai_result.get("severity", 5.0),
        ai_confidence=ai_result.get("ai_confidence"),
        ai_category=ai_result.get("ai_category"),
        latitude=body.latitude,
        longitude=body.longitude,
        address=body.address,
        image_url=body.image_url,
        status=ComplaintStatus.PENDING
    )
    
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint

@router.get("", response_model=List[ComplaintResponse])
def get_complaints(
    status: Optional[ComplaintStatus] = Query(None),
    category: Optional[ComplaintCategory] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint).options(
        joinedload(Complaint.citizen),
        joinedload(Complaint.assignment),
        joinedload(Complaint.resolution),
        joinedload(Complaint.rating)
    )

    if current_user.role == UserRole.CITIZEN:
        query = query.filter(Complaint.citizen_id == current_user.id)

    if status:
        query = query.filter(Complaint.status == status)
    if category:
        query = query.filter(Complaint.category == category)

    return query.order_by(Complaint.created_at.desc()).all()

@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).options(
        joinedload(Complaint.citizen),
        joinedload(Complaint.assignment),
        joinedload(Complaint.resolution),
        joinedload(Complaint.rating)
    ).filter(Complaint.id == complaint_id).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == UserRole.CITIZEN and complaint.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this complaint")

    return complaint

@router.patch("/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(
    complaint_id: int,
    body: ComplaintPatch,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == UserRole.CITIZEN and complaint.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this complaint")

    if body.title is not None:
        complaint.title = body.title
    if body.description is not None:
        complaint.description = body.description
    if body.category is not None:
        complaint.category = body.category
    if body.status is not None:
        if current_user.role == UserRole.CITIZEN and body.status == ComplaintStatus.CANCELLED:
            complaint.status = ComplaintStatus.CANCELLED
        elif current_user.role in [UserRole.ADMIN, UserRole.CREW]:
            complaint.status = body.status

    db.commit()
    db.refresh(complaint)
    return complaint

@router.post("/{complaint_id}/assign", response_model=ComplaintResponse)
def assign_complaint_to_crew(
    complaint_id: int,
    body: AssignmentCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    crew_user = db.query(User).filter(User.id == body.crew_id, User.role == UserRole.CREW).first()
    if not crew_user:
        raise HTTPException(status_code=400, detail="Invalid crew member ID")

    existing_assignment = db.query(Assignment).filter(Assignment.complaint_id == complaint_id).first()
    if existing_assignment:
        existing_assignment.crew_id = body.crew_id
    else:
        assignment = Assignment(complaint_id=complaint_id, crew_id=body.crew_id)
        db.add(assignment)

    complaint.status = ComplaintStatus.ASSIGNED
    db.commit()
    db.refresh(complaint)
    return complaint

@router.post("/{complaint_id}/resolve", response_model=ComplaintResponse)
def resolve_complaint_task(
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

    if not assignment and current_user.role != UserRole.ADMIN:
        assignment = Assignment(complaint_id=complaint_id, crew_id=current_user.id)
        db.add(assignment)

    image_url = body.get_image_url()
    existing_res = db.query(Resolution).filter(Resolution.complaint_id == complaint_id).first()
    if existing_res:
        existing_res.resolution_image_url = image_url
        existing_res.notes = body.notes
        existing_res.rejection_reason = None
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


@router.post("/{complaint_id}/verify", response_model=ComplaintResponse)
def verify_complaint(
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
    db.refresh(complaint)
    return complaint

@router.post("/{complaint_id}/rate", response_model=ComplaintResponse)
def rate_complaint(
    complaint_id: int,
    body: RatingCreate,
    current_user: User = Depends(require_citizen),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if complaint.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only rate your own complaints")

    if complaint.status != ComplaintStatus.VERIFIED:
        raise HTTPException(status_code=400, detail="Only verified complaints can be rated")

    existing_rating = db.query(Rating).filter(Rating.complaint_id == complaint_id).first()
    if existing_rating:
        existing_rating.score = body.score
        existing_rating.feedback = body.feedback
    else:
        rating = Rating(
            complaint_id=complaint_id,
            citizen_id=current_user.id,
            score=body.score,
            feedback=body.feedback
        )
        db.add(rating)

    db.commit()
    db.refresh(complaint)
    return complaint
