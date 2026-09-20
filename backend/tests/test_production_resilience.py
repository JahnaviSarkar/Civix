import os
import sys
import pytest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)
backend_dir = os.path.join(ROOT_DIR, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from api.index import app

def test_production_smoke_import_and_title():
    assert app is not None
    assert app.title
    assert len(app.title.strip()) > 0

def test_production_smoke_docs_endpoints():
    client = TestClient(app)

    resp_docs = client.get("/api/docs")
    assert resp_docs.status_code == 200

    resp_openapi = client.get("/api/openapi.json")
    assert resp_openapi.status_code == 200
    assert resp_openapi.json().get("info", {}).get("title")

def test_production_smoke_root_endpoint():
    client = TestClient(app)
    resp_root = client.get("/")
    assert resp_root.status_code == 200
    data = resp_root.json()
    assert data.get("status") == "online"
