import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.enums import UserRole
from app.dependencies.auth import get_current_user, require_admin
from app.services.firestore import FirestoreRepository, set_testing_mode

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_verification_db():
    set_testing_mode(True)

    admin_user = FirestoreRepository.create_user("demo_uid_admin", "Municipal Admin", "admin@smartwaste.local", UserRole.ADMIN.value)
    citizen_user = FirestoreRepository.create_user("demo_uid_citizen", "Jane Citizen", "citizen@smartwaste.local", UserRole.CITIZEN.value)
    crew_user = FirestoreRepository.create_user("demo_uid_crew", "Crew Alpha", "crew@smartwaste.local", UserRole.CREW.value)

    payload = {
        "title": "Overflowing Dumpster",
        "description": "Dumpster overflowing onto road",
        "category": "Garbage Collection",
        "severity": 7.5,
        "latitude": 12.97,
        "longitude": 77.59,
        "address": "123 Park Street",
        "image_url": "data:image/png;base64,citizen_before_photo_data"
    }
    complaint = FirestoreRepository.create_complaint(citizen_user, payload)
    cid = complaint["id"]
    FirestoreRepository.assign_complaint(cid, crew_user, notes="Assigned")
    FirestoreRepository.resolve_complaint(cid, crew_user["id"], notes="Area cleared", after_image_url="data:image/png;base64,crew_after_photo_data")

    def override_require_admin():
        return admin_user

    app.dependency_overrides[require_admin] = override_require_admin
    app.dependency_overrides[get_current_user] = override_require_admin
    yield
    app.dependency_overrides.clear()
    set_testing_mode(False)

def test_admin_approve_verification():
    response = client.post(
        "/api/complaints/1/verify",
        json={"accepted": True}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "VERIFIED"
    assert data["image_url"] == "data:image/png;base64,citizen_before_photo_data"
    assert data["resolution"]["resolution_image_url"] == "data:image/png;base64,crew_after_photo_data"

def test_admin_reject_verification():
    response = client.post(
        "/api/complaints/1/verify",
        json={"accepted": False, "rejection_reason": "Garbage still visible on curbside."}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "REJECTED"
    assert data["resolution"]["rejection_reason"] == "Garbage still visible on curbside."

def test_legacy_admin_verify_route():
    response = client.post(
        "/admin_verify",
        json={"complaint_id": 1}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "VERIFIED"
