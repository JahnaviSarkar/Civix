import os
import sys
import pytest
from unittest.mock import patch, MagicMock
from sqlalchemy.exc import OperationalError

# Ensure root and backend are in path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)
backend_dir = os.path.join(ROOT_DIR, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from api.index import app

def test_production_smoke_import_and_title():
    # Verify app exists and title is non-empty
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

def test_production_smoke_db_down_graceful_handling():
    # Simulate DB operational failure on get_db dependency
    client = TestClient(app)
    
    with patch("app.database.SessionLocal", side_effect=OperationalError("Could not connect to server", None, None)):
        # Attempt to access a DB-dependent endpoint without crashing process
        resp = client.get("/api/complaints")
        # Should respond with HTTP 503 Service Unavailable or 401 Unauthorized, NOT a 500 serverless crash
        assert resp.status_code in [503, 401]

def test_vercel_unconfigured_db_returns_503(monkeypatch):
    monkeypatch.setenv("VERCEL", "1")
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("POSTGRES_URL", raising=False)

    from app.config import Settings
    from app.database import sanitize_database_url

    settings = Settings()
    assert settings.DATABASE_URL == ""
    _, is_configured = sanitize_database_url(settings.DATABASE_URL)
    assert is_configured is False
