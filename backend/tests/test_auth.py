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

def test_api_docs_and_openapi():
    res_docs = client.get("/api/docs")
    assert res_docs.status_code == 200
    assert "swagger-ui" in res_docs.text.lower()

    res_openapi = client.get("/api/openapi.json")
    assert res_openapi.status_code == 200
    assert "openapi" in res_openapi.json()

def test_unauthorized_access():
    response = client.get("/api/complaints")
    assert response.status_code == 403 or response.status_code == 401

def test_demo_auth_me():
    headers = {"Authorization": "Bearer demo-citizen"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "citizen@smartwaste.local"
    assert data["role"] == "citizen"
