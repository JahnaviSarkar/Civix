import os
import pytest
from fastapi import HTTPException
from sqlalchemy.engine import make_url
from app.database import normalize_database_url, sanitize_database_url, get_db
from app.config import Settings, get_default_db_url

def test_normalize_database_url_valid_postgres():
    raw = "postgresql://user:secret123@ep-cool.neon.tech:5432/neondb?sslmode=require"
    norm = normalize_database_url(raw)
    assert norm.startswith("postgresql+psycopg2://")
    parsed = make_url(norm)
    assert parsed.drivername == "postgresql+psycopg2"
    assert parsed.username == "user"
    assert parsed.host == "ep-cool.neon.tech"
    assert parsed.port == 5432
    assert parsed.database == "neondb"
    assert parsed.query.get("sslmode") == "require"

def test_normalize_database_url_legacy_postgres_scheme():
    raw = "postgres://user:pass@localhost:5432/dbname"
    norm = normalize_database_url(raw)
    assert norm.startswith("postgresql+psycopg2://")
    assert "postgres://" not in norm

def test_normalize_database_url_ssl_params():
    raw = "postgresql://user:pass@host:5432/db?sslmode=require&channel_binding=disable"
    norm = normalize_database_url(raw)
    parsed = make_url(norm)
    assert parsed.query.get("sslmode") == "require"
    assert parsed.query.get("channel_binding") == "disable"

def test_normalize_database_url_missing_or_empty():
    assert normalize_database_url("") == ""
    assert normalize_database_url("   ") == ""
    assert normalize_database_url(None) == ""

def test_sanitize_database_url_backward_compatibility():
    sanitized, is_valid = sanitize_database_url("postgres://u:p@h:5432/d")
    assert is_valid is True
    assert sanitized.startswith("postgresql+psycopg2://")

    sanitized_empty, is_valid_empty = sanitize_database_url("")
    assert is_valid_empty is False
    assert sanitized_empty == "sqlite:///:memory:"

def test_get_db_unconfigured_error_message(monkeypatch):
    import app.database as db_mod
    monkeypatch.setattr(db_mod, "is_db_configured", False)

    monkeypatch.setattr(db_mod, "db_url", "")
    with pytest.raises(HTTPException) as exc_info1:
        next(db_mod.get_db())
    assert exc_info1.value.status_code == 503
    assert exc_info1.value.detail == "Database service unavailable: Connection string not configured."

    monkeypatch.setattr(db_mod, "db_url", "postgresql+psycopg2://user:pass@host/db")
    with pytest.raises(HTTPException) as exc_info2:
        next(db_mod.get_db())
    assert exc_info2.value.status_code == 503
    assert exc_info2.value.detail == "Database service unavailable: Engine initialization failed. Please check server logs."

def test_settings_postgres_env_fallbacks(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("POSTGRES_URL", "postgres://user:pass@host:5432/db")
    
    settings = Settings()
    assert settings.DATABASE_URL == "postgres://user:pass@host:5432/db"
    norm = normalize_database_url(settings.DATABASE_URL)
    assert norm.startswith("postgresql+psycopg2://")

