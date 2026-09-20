import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "title" in data
    assert data["status"] == "online"

def test_api_aliases():
    for endpoint in ["/api", "/api/"]:
        res = client.get(endpoint)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "online"

def test_api_docs_and_openapi_without_firestore():
    res_docs = client.get("/api/docs")
    assert res_docs.status_code == 200
    assert "swagger-ui" in res_docs.text.lower()

    res_openapi = client.get("/api/openapi.json")
    assert res_openapi.status_code == 200
    assert "openapi" in res_openapi.json()

def test_unauthorized_access():
    response = client.get("/api/complaints")
    assert response.status_code in [401, 403]

def test_demo_auth_me_all_roles():
    for role_key in ["citizen", "crew", "admin"]:
        headers = {"Authorization": f"Bearer demo-{role_key}"}
        response = client.get("/api/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == f"{role_key}@smartwaste.local"
        assert data["role"] == role_key

def test_invalid_demo_token_rejected():
    headers = {"Authorization": "Bearer demo-superadmin"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 401

def test_unauthorized_arbitrary_token_rejected():
    headers = {"Authorization": "Bearer fake-token-12345"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 401

def test_prevent_role_escalation_on_sync():
    headers = {"Authorization": "Bearer demo-citizen"}
    # Attempt to self-assign admin role via sync
    payload = {"name": "Hacked Citizen Name", "email": "citizen@smartwaste.local", "role": "admin"}
    response = client.post("/api/auth/sync", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Hacked Citizen Name"
    assert data["role"] == "citizen"  # Role MUST remain citizen!

def test_demo_tokens_rejected_when_flag_disabled():
    from app.config import settings
    settings.ENABLE_DEMO_TOKENS = False
    headers = {"Authorization": "Bearer demo-citizen"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 401
    settings.ENABLE_DEMO_TOKENS = True

def test_demo_tokens_accepted_when_flag_enabled():
    from app.config import settings
    settings.ENABLE_DEMO_TOKENS = True
    for role_key in ["citizen", "crew", "admin"]:
        headers = {"Authorization": f"Bearer demo-{role_key}"}
        response = client.get("/api/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == role_key

@pytest.mark.anyio
async def test_lifespan_seeding_disabled_by_default():
    from app.config import settings
    from app.main import lifespan
    from app.services.firestore import FirestoreRepository, set_testing_mode

    settings.ENABLE_DEMO_SEEDING = False
    mock_store = {
        "users": {},
        "complaints": {},
        "assignments": {},
        "resolutions": {},
        "ratings": {},
        "counters": {"user_id": 0, "complaint_id": 0, "assignment_id": 0, "resolution_id": 0, "rating_id": 0}
    }
    set_testing_mode(True, mock_store)

    async with lifespan(app):
        pass

    assert FirestoreRepository.get_user_by_uid("demo_uid_citizen") is None

@pytest.mark.anyio
async def test_lifespan_seeding_enabled_by_flag():
    from app.config import settings
    from app.main import lifespan
    from app.services.firestore import FirestoreRepository, set_testing_mode

    settings.ENABLE_DEMO_SEEDING = True
    mock_store = {
        "users": {},
        "complaints": {},
        "assignments": {},
        "resolutions": {},
        "ratings": {},
        "counters": {"user_id": 0, "complaint_id": 0, "assignment_id": 0, "resolution_id": 0, "rating_id": 0}
    }
    set_testing_mode(True, mock_store)

    async with lifespan(app):
        pass

    assert FirestoreRepository.get_user_by_uid("demo_uid_citizen") is not None
    settings.ENABLE_DEMO_SEEDING = False

def test_get_firebase_app_uninitialized_raises_503(monkeypatch):
    import os
    import firebase_admin
    from fastapi import HTTPException
    import app.dependencies.auth as auth_dep

    monkeypatch.setattr(firebase_admin, "_apps", {})
    monkeypatch.setattr(auth_dep, "_firebase_initialized", False)
    monkeypatch.setattr(auth_dep.settings, "FIREBASE_PROJECT_ID", "")
    monkeypatch.setattr(auth_dep.settings, "FIREBASE_CLIENT_EMAIL", "")
    monkeypatch.setattr(auth_dep.settings, "FIREBASE_PRIVATE_KEY", "")
    monkeypatch.setattr(os.path, "exists", lambda p: False)

    with pytest.raises(HTTPException) as exc_info:
        auth_dep.get_firebase_app()

    assert exc_info.value.status_code == 503
    assert "Authentication service unavailable" in exc_info.value.detail
