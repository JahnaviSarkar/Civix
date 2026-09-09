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
from app.dependencies.auth import get_current_user

# Create test SQLite database
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
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    crew = User(
        id=2,
        firebase_uid="demo_uid_crew",
        name="Crew Alpha Team",
        email="crew@smartwaste.local",
        role=UserRole.CREW
    )
    citizen = User(
        id=1,
        firebase_uid="demo_uid_citizen",
        name="Jane Citizen",
        email="citizen@smartwaste.local",
        role=UserRole.CITIZEN
    )
    db.add_all([crew, citizen])
    
    complaint = Complaint(
        id=10,
        citizen_id=1,
        title="Garbage at Market",
        description="Market waste overflowing",
        category=ComplaintCategory.GARBAGE_COLLECTION,
        severity=8.0,
        latitude=12.97,
        longitude=77.59,
        address="Market Sq",
        status=ComplaintStatus.ASSIGNED
    )
    db.add(complaint)
    db.commit()
    db.close()

    def override_get_db():
        try:
            db_session = TestingSessionLocal()
            yield db_session
        finally:
            db_session.close()

    def override_get_current_user(db_session: Session = Depends(override_get_db)):
        return db_session.query(User).filter(User.id == 2).first()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    app.dependency_overrides.clear()

def test_crew_resolve_upload_picture():
    fake_after_picture = "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    
    response = client.post(
        "/api/crew/resolve/10",
        json={
            "notes": "Cleaned up market waste completely.",
            "after_image_url": fake_after_picture
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "RESOLVED"
    assert data["resolution"] is not None
    assert data["resolution"]["resolution_image_url"] == fake_after_picture
    assert data["resolution"]["after_image_url"] == fake_after_picture
    assert data["resolution"]["notes"] == "Cleaned up market waste completely."

def test_legacy_crew_upload_route():
    fake_after_picture = "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    
    response = client.post(
        "/crew_upload",
        json={
            "complaint_id": 10,
            "after_image_url": fake_after_picture,
            "notes": "Resolved via legacy form"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "RESOLVED"
    assert data["resolution"]["resolution_image_url"] == fake_after_picture
