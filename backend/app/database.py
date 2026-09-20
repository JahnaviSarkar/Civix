import logging
from sqlalchemy import create_engine
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import SQLAlchemyError, OperationalError, DBAPIError
from fastapi import HTTPException, status
from app.config import settings

logger = logging.getLogger("civix.database")

def normalize_database_url(url: str) -> str:
    """
    Normalizes PostgreSQL and SQLite connection URLs for SQLAlchemy.
    Converts legacy postgres:// and postgresql:// schemes to postgresql+psycopg2://
    while leaving query parameters (e.g. ?sslmode=require) and SQLite paths intact.
    """
    if not url or not isinstance(url, str):
        return ""

    cleaned = url.strip().strip("'\"")
    if not cleaned:
        return ""

    if cleaned.startswith("postgres://"):
        return "postgresql+psycopg2://" + cleaned[len("postgres://"):]

    if cleaned.startswith("postgresql://") and not cleaned.startswith("postgresql+"):
        return "postgresql+psycopg2://" + cleaned[len("postgresql://"):]

    return cleaned

def sanitize_database_url(url: str) -> tuple[str, bool]:
    """
    Backward-compatible helper returning (normalized_url, is_valid)
    """
    norm = normalize_database_url(url)
    if not norm:
        return ("sqlite:///:memory:", False)
    return (norm, True)

raw_url = settings.DATABASE_URL
db_url = normalize_database_url(raw_url)

is_db_configured = False
db_init_error = None
safe_db_url = "unconfigured"

if db_url:
    try:
        url_obj = make_url(db_url)
        safe_db_url = url_obj.render_as_string(hide_password=True)
    except Exception:
        safe_db_url = "invalid-url-format"

if not db_url:
    db_init_error = "DATABASE_URL environment variable is missing or empty."
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
else:
    connect_args = {}
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}

    try:
        engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
        is_db_configured = True
    except Exception as e:
        error_msg = str(e)
        if raw_url and raw_url in error_msg:
            error_msg = error_msg.replace(raw_url, safe_db_url)
        db_init_error = f"Database engine creation failed ({type(e).__name__}): {error_msg}"
        logger.error(f"Database initialization failed for {safe_db_url}: {db_init_error}")
        engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        is_db_configured = False

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    if not is_db_configured:
        if not db_url:
            client_detail = "Database service unavailable: Connection string not configured."
        else:
            client_detail = "Database service unavailable: Engine initialization failed. Please check server logs."
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=client_detail
        )

    db = None
    try:
        db = SessionLocal()
        yield db
    except (OperationalError, DBAPIError, SQLAlchemyError) as e:
        logger.error(f"Database runtime connection failed for {safe_db_url}: {type(e).__name__}")
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
