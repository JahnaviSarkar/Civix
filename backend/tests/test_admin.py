from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_admin_crews_list():
    headers = {"Authorization": "Bearer demo-admin"}
    response = client.get("/api/admin/crews", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_admin_rbac_protection():
    # Citizen should NOT be able to access admin crews endpoint
    headers = {"Authorization": "Bearer demo-citizen"}
    response = client.get("/api/admin/crews", headers=headers)
    assert response.status_code == 403
