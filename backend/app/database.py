import re
from urllib.parse import quote, unquote
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import SQLAlchemyError, OperationalError, DBAPIError
from fastapi import HTTPException, status
from app.config import settings

def sanitize_database_url(url: str) -> tuple[str, bool]:
    """
    Safely sanitizes and formats PostgreSQL / SQLite database connection URLs
    for SQLAlchemy and psycopg2 driver compatibility.
    Returns (sanitized_url, is_valid_url)
    """
    if not url or not isinstance(url, str):
        return ("sqlite:///:memory:", False)

    # Clean whitespace and surrounding quotes
    cleaned = url.strip().strip("'\"")
    if not cleaned:
        return ("sqlite:///:memory:", False)

    # Normalize PostgreSQL driver schemes to postgresql+psycopg2://
    if cleaned.startswith("postgres://"):
        cleaned = "postgresql+psycopg2://" + cleaned[len("postgres://"):]
    elif cleaned.startswith("postgresql://"):
        cleaned = "postgresql+psycopg2://" + cleaned[len("postgresql://"):]

    # Check if scheme is postgresql+psycopg2://
    if cleaned.startswith("postgresql+psycopg2://"):
        pattern = r'^(postgresql\+psycopg2://)([^:]+):(.*)@([a-zA-Z0-9.\-_]+(?::\d+)?)(.*)$'
        match = re.match(pattern, cleaned)
        if match:
            scheme, user, password, host_port, rest = match.groups()
            safe_user = quote(unquote(user), safe='')
            safe_password = quote(unquote(password), safe='')
            cleaned = f"{scheme}{safe_user}:{safe_password}@{host_port}{rest}"
        return (cleaned, True)

    if cleaned.startswith("sqlite"):
        return (cleaned, True)

    return (cleaned, True)

raw_url = settings.DATABASE_URL
db_url, is_db_configured = sanitize_database_url(raw_url)

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
except Exception:
    # Safe fallback engine so top-level module import and docs endpoints never crash
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    is_db_configured = False

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    if not is_db_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable. Please configure DATABASE_URL in production environment variables."
        )
    db = None
    try:
        db = SessionLocal()
        yield db
    except (OperationalError, DBAPIError, SQLAlchemyError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service temporarily unavailable. Please try again later."
        )
    finally:
        if db is not None:
            try:
                db.close()
            except Exception:
                pass
