import pytest
from fastapi import Depends
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintStatus, ComplaintCategory
from app.models.resolution import Resolution
from app.dependencies.auth import get_current_user, require_admin

# Create in-memory test SQLite DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_verification_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    admin_user = User(
        id=3,
        firebase_uid="demo_uid_admin",
        name="Municipal Admin",
        email="admin@smartwaste.local",
        role=UserRole.ADMIN
    )
    citizen_user = User(
        id=1,
        firebase_uid="demo_uid_citizen",
        name="Jane Citizen",
        email="citizen@smartwaste.local",
        role=UserRole.CITIZEN
    )
    crew_user = User(
        id=2,
        firebase_uid="demo_uid_crew",
        name="Crew Alpha",
        email="crew@smartwaste.local",
        role=UserRole.CREW
    )
    db.add_all([admin_user, citizen_user, crew_user])

    # Add resolved complaint awaiting admin verification with both citizen and crew photos
    complaint = Complaint(
        id=100,
        citizen_id=1,
        title="Overflowing Dumpster",
        description="Dumpster overflowing onto road",
        category=ComplaintCategory.GARBAGE_COLLECTION,
        severity=7.5,
        latitude=12.97,
        longitude=77.59,
        address="123 Park Street",
        image_url="data:image/png;base64,citizen_before_photo_data",
        status=ComplaintStatus.RESOLVED
    )
    db.add(complaint)

    resolution = Resolution(
        id=50,
        complaint_id=100,
        crew_id=2,
        resolution_image_url="data:image/png;base64,crew_after_photo_data",
        notes="Area cleared and disinfected."
    )
    db.add(resolution)
    db.commit()
    db.close()

    def override_get_db():
        try:
            db_session = TestingSessionLocal()
            yield db_session
        finally:
            db_session.close()

    def override_require_admin(db_session: Session = Depends(override_get_db)):
        return db_session.query(User).filter(User.id == 3).first()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[require_admin] = override_require_admin
    app.dependency_overrides[get_current_user] = override_require_admin
    yield
    app.dependency_overrides.clear()

def test_admin_approve_verification():
    response = client.post(
        "/api/complaints/100/verify",
        json={"accepted": True}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "VERIFIED"
    assert data["image_url"] == "data:image/png;base64,citizen_before_photo_data"
    assert data["resolution"]["resolution_image_url"] == "data:image/png;base64,crew_after_photo_data"

def test_admin_reject_verification():
    response = client.post(
        "/api/complaints/100/verify",
        json={"accepted": False, "rejection_reason": "Garbage still visible on curbside."}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "REJECTED"
    assert data["resolution"]["rejection_reason"] == "Garbage still visible on curbside."

def test_legacy_admin_verify_route():
    response = client.post(
        "/admin_verify",
        json={"complaint_id": 100}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "VERIFIED"
