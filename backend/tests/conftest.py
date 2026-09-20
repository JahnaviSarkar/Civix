import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.firestore import set_testing_mode, FirestoreRepository

@pytest.fixture(scope="function", autouse=True)
def reset_firestore_testing_store():
    from app.config import settings
    settings.ENABLE_DEMO_TOKENS = True

    mock_store = {
        "users": {},
        "complaints": {},
        "assignments": {},
        "resolutions": {},
        "ratings": {},
        "counters": {"user_id": 0, "complaint_id": 0, "assignment_id": 0, "resolution_id": 0, "rating_id": 0}
    }
    set_testing_mode(True, mock_store)

    # Pre-seed default demo users
    FirestoreRepository.create_user("demo_uid_citizen", "Jane Citizen", "citizen@smartwaste.local", "citizen")
    FirestoreRepository.create_user("demo_uid_crew", "Crew Alpha Team", "crew@smartwaste.local", "crew")
    FirestoreRepository.create_user("demo_uid_admin", "Municipal Admin", "admin@smartwaste.local", "admin")
    yield


@pytest.fixture
def client():
    return TestClient(app)
