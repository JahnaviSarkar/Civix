import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.enums import UserRole
from app.dependencies.auth import get_current_user
from app.services.firestore import FirestoreRepository, set_testing_mode

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_firestore_db():
    set_testing_mode(True)
    
    crew = FirestoreRepository.create_user("demo_uid_crew", "Crew Alpha Team", "crew@smartwaste.local", UserRole.CREW.value)
    citizen = FirestoreRepository.create_user("demo_uid_citizen", "Jane Citizen", "citizen@smartwaste.local", UserRole.CITIZEN.value)

    payload = {
        "title": "Garbage at Market",
        "description": "Market waste overflowing",
        "category": "Garbage Collection",
        "severity": 8.0,
        "latitude": 12.97,
        "longitude": 77.59,
        "address": "Market Sq"
    }
    complaint = FirestoreRepository.create_complaint(citizen, payload)
    cid = complaint["id"]
    FirestoreRepository.assign_complaint(cid, crew, notes="Assigned to crew")

    def override_get_current_user():
        return crew

    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    app.dependency_overrides.clear()
    set_testing_mode(False)

def test_crew_resolve_upload_picture():
    fake_after_picture = "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    
    response = client.post(
        "/api/crew/resolve/1",
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
            "complaint_id": 1,
            "after_image_url": fake_after_picture,
            "notes": "Resolved via legacy form"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "RESOLVED"
    assert data["resolution"]["resolution_image_url"] == fake_after_picture
