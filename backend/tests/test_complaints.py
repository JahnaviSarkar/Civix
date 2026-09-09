from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_citizen_create_complaint():
    headers = {"Authorization": "Bearer demo-citizen"}
    payload = {
        "title": "Overflowing bin on 5th avenue",
        "description": "The dustbin is overflowing onto the street sidewalk.",
        "category": "Garbage Collection",
        "latitude": 12.97159,
        "longitude": 77.59456,
        "address": "5th Avenue, Indiranagar"
    }
    response = client.post("/api/complaints", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Overflowing bin on 5th avenue"
    assert data["status"] == "PENDING"
    assert "severity" in data

def test_get_complaints_list():
    headers = {"Authorization": "Bearer demo-citizen"}
    response = client.get("/api/complaints", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_admin_assign_crew_workflow():
    headers_citizen = {"Authorization": "Bearer demo-citizen"}
    payload = {
        "title": "Pothole on Ring Road",
        "description": "Large dangerous pothole.",
        "category": "Pothole",
        "latitude": 12.93,
        "longitude": 77.62,
        "address": "Ring Road Indiranagar"
    }
    c_res = client.post("/api/complaints", json=payload, headers=headers_citizen)
    complaint_id = c_res.json()["id"]

    headers_admin = {"Authorization": "Bearer demo-admin"}
    crews_res = client.get("/api/admin/crews", headers=headers_admin)
    crew_id = crews_res.json()[0]["id"]

    assign_res = client.post(f"/api/complaints/{complaint_id}/assign", json={"complaint_id": complaint_id, "crew_id": crew_id}, headers=headers_admin)
    assert assign_res.status_code == 200
    assert assign_res.json()["status"] == "ASSIGNED"

def test_crew_resolve_workflow():
    headers_citizen = {"Authorization": "Bearer demo-citizen"}
    c_res = client.post("/api/complaints", json={
        "title": "Drain Blocked at BTM",
        "description": "Blockage causing water accumulation.",
        "category": "Drain Blockage",
        "latitude": 12.91,
        "longitude": 77.61,
        "address": "BTM Layout 2nd Stage"
    }, headers=headers_citizen)
    complaint_id = c_res.json()["id"]

    headers_admin = {"Authorization": "Bearer demo-admin"}
    crews_res = client.get("/api/admin/crews", headers=headers_admin)
    crew_id = crews_res.json()[0]["id"]
    client.post(f"/api/complaints/{complaint_id}/assign", json={"complaint_id": complaint_id, "crew_id": crew_id}, headers=headers_admin)

    headers_crew = {"Authorization": "Bearer demo-crew"}
    resolve_res = client.post(f"/api/complaints/{complaint_id}/resolve", json={
        "notes": "Cleared drainage blockage using pressure jet",
        "resolution_image_url": "https://storage.example.com/resolved_drain.jpg"
    }, headers=headers_crew)
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "RESOLVED"
