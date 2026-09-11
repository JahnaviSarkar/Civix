from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, SessionLocal, get_db
from app.models import User, UserRole, Complaint, ComplaintStatus, ComplaintCategory
from app.routers import (
    auth_router,
    complaints_router,
    crew_router,
    admin_router,
    analytics_router,
    users_router,
)
from app.routers.analytics import get_analytics_overview
from app.dependencies.auth import get_current_user, require_admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        # Initialize DB tables safely
        Base.metadata.create_all(bind=engine)
        # Seed initial demo users & data if empty
        db = SessionLocal()
        try:
            if db.query(User).count() == 0:
                demo_users = [
                    User(firebase_uid="demo_uid_citizen", name="Jane Citizen", email="citizen@smartwaste.local", role=UserRole.CITIZEN),
                    User(firebase_uid="demo_uid_crew", name="Crew Alpha Team", email="crew@smartwaste.local", role=UserRole.CREW),
                    User(firebase_uid="demo_uid_admin", name="Municipal Admin", email="admin@smartwaste.local", role=UserRole.ADMIN),
                ]
                db.add_all(demo_users)
                db.commit()

                # Seed demo complaint
                cit = db.query(User).filter(User.role == UserRole.CITIZEN).first()
                if cit:
                    sample_complaint = Complaint(
                        citizen_id=cit.id,
                        title="Overflowing Public Dustbin at MG Road",
                        description="The main commercial dustbin is overflowing causing road obstruction and odor.",
                        category=ComplaintCategory.GARBAGE_COLLECTION,
                        severity=7.8,
                        ai_confidence=0.92,
                        ai_category="Garbage Collection",
                        latitude=12.97159,
                        longitude=77.59456,
                        address="MG Road Sector 14, Bengaluru",
                        status=ComplaintStatus.PENDING
                    )
                    db.add(sample_complaint)
                    db.commit()
        except Exception as e:
            print(f"Lifespan seeding warning: {e}")
        finally:
            db.close()
    except Exception as e:
        print(f"Lifespan DB initialization warning: {e}")
        
    yield

api_title = (settings.PROJECT_NAME or "").strip() or "CIVIX Smart Waste Management Platform"
api_version = (settings.VERSION or "").strip() or "2.0.0"
api_v1_str = (settings.API_V1_STR or "").strip() or "/api"

app = FastAPI(
    title=api_title,
    version=api_version,
    docs_url=f"{api_v1_str}/docs",
    openapi_url=f"{api_v1_str}/openapi.json",
    lifespan=lifespan
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(complaints_router, prefix=settings.API_V1_STR)
app.include_router(crew_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)

from fastapi import Request, HTTPException
from app.schemas.resolution import ResolutionCreate
from app.routers.crew import resolve_task

@app.get(f"{settings.API_V1_STR}/dashboard/stats")
def dashboard_stats_alias(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_analytics_overview(current_user=current_user, db=db)

@app.post("/crew_upload")
async def legacy_crew_upload(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = await request.json()
    complaint_id = data.get("complaint_id")
    after_image_url = data.get("after_image_url") or data.get("after_img_url") or data.get("resolution_image_url")
    notes = data.get("notes", "Cleaned up bin overflow and disinfected area.")
    if not complaint_id or not after_image_url:
        raise HTTPException(status_code=400, detail="Missing complaint_id or after_image_url")
    body = ResolutionCreate(after_image_url=after_image_url, notes=notes)
    return resolve_task(complaint_id=int(complaint_id), body=body, current_user=current_user, db=db)

from app.schemas.resolution import VerificationRequest
from app.routers.admin import verify_complaint_resolution

@app.post("/admin_verify")
@app.post("/verification/admin-close")
async def legacy_admin_verify(request: Request, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    data = await request.json()
    complaint_id = data.get("complaint_id")
    if not complaint_id:
        raise HTTPException(status_code=400, detail="Missing complaint_id")
    body = VerificationRequest(accepted=True, rejection_reason=None)
    return verify_complaint_resolution(complaint_id=int(complaint_id), body=body, current_user=current_user, db=db)

@app.post("/admin_reject")
async def legacy_admin_reject(request: Request, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    data = await request.json()
    complaint_id = data.get("complaint_id")
    review_text = data.get("review_text") or data.get("rejection_reason") or "Work rejected by admin"
    if not complaint_id:
        raise HTTPException(status_code=400, detail="Missing complaint_id")
    body = VerificationRequest(accepted=False, rejection_reason=review_text)
    return verify_complaint_resolution(complaint_id=int(complaint_id), body=body, current_user=current_user, db=db)

from fastapi.responses import RedirectResponse

@app.get("/docs", include_in_schema=False)
def docs_redirect():
    return RedirectResponse(url=f"{settings.API_V1_STR}/docs")

@app.get("/")
def root():
    return {
        "title": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": f"{settings.API_V1_STR}/docs",
        "status": "online"
    }


