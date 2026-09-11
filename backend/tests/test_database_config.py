import os
import pytest
from sqlalchemy.engine import make_url
from app.database import sanitize_database_url
from app.config import Settings, get_default_db_url

def test_sanitize_database_url_quotes_and_whitespace():
    raw_url = ' "postgres://user:password@localhost:5432/dbname" '
    sanitized = sanitize_database_url(raw_url)
    assert sanitized.startswith("postgresql+psycopg2://")
    assert '"' not in sanitized
    assert "'" not in sanitized
    parsed = make_url(sanitized)
    assert parsed.drivername == "postgresql+psycopg2"
    assert parsed.username == "user"
    assert parsed.host == "localhost"
    assert parsed.port == 5432
    assert parsed.database == "dbname"

def test_sanitize_database_url_special_characters_in_password():
    raw_url = "postgresql://user:p@ss:w#rd@ep-test.postgres.vercel-storage.com:5432/verceldb?sslmode=require"
    sanitized = sanitize_database_url(raw_url)
    assert sanitized.startswith("postgresql+psycopg2://")
    parsed = make_url(sanitized)
    assert parsed.drivername == "postgresql+psycopg2"
    assert parsed.username == "user"
    assert parsed.host == "ep-test.postgres.vercel-storage.com"
    assert parsed.port == 5432
    assert parsed.database == "verceldb"

def test_sanitize_database_url_sqlite():
    sqlite_url = "sqlite:///./civix_smart_waste.db"
    assert sanitize_database_url(sqlite_url) == sqlite_url

def test_settings_postgres_env_fallbacks(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("POSTGRES_URL", "postgres://user:pass@host:5432/db")
    
    settings = Settings()
    assert settings.DATABASE_URL == "postgres://user:pass@host:5432/db"
    sanitized = sanitize_database_url(settings.DATABASE_URL)
    assert sanitized.startswith("postgresql+psycopg2://")
