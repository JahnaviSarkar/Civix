import re
from urllib.parse import quote, unquote
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import SQLAlchemyError, OperationalError, DBAPIError
from fastapi import HTTPException, status
from app.config import settings

def sanitize_database_url(url: str) -> str:
    """
    Safely sanitizes and formats PostgreSQL / SQLite database connection URLs
    for SQLAlchemy and psycopg2 driver compatibility.
    Handles:
    - Surrounding quotes (" or ') and whitespace
    - postgres:// -> postgresql+psycopg2:// scheme conversion
    - postgresql:// -> postgresql+psycopg2:// scheme conversion
    - Unescaped special characters in credentials
    """
    if not url or not isinstance(url, str):
        return "sqlite:///:memory:"

    # Clean whitespace and surrounding quotes
    url = url.strip().strip("'\"")
    if not url:
        return "sqlite:///:memory:"

    # Normalize PostgreSQL driver schemes to postgresql+psycopg2://
    if url.startswith("postgres://"):
        url = "postgresql+psycopg2://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]

    # Check if scheme is postgresql+psycopg2://
    if url.startswith("postgresql+psycopg2://"):
        pattern = r'^(postgresql\+psycopg2://)([^:]+):(.*)@([a-zA-Z0-9.\-_]+(?::\d+)?)(.*)$'
        match = re.match(pattern, url)
        if match:
            scheme, user, password, host_port, rest = match.groups()
            safe_user = quote(unquote(user), safe='')
            safe_password = quote(unquote(password), safe='')
            url = f"{scheme}{safe_user}:{safe_password}@{host_port}{rest}"

    return url

db_url = sanitize_database_url(settings.DATABASE_URL)

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
except Exception:
    # Fallback to an in-memory SQLite engine if engine creation fails
    # so top-level module import and documentation endpoints never crash
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = None
    try:
        db = SessionLocal()
        yield db
    except (OperationalError, DBAPIError, SQLAlchemyError) as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service temporarily unavailable. Please try again."
        )
    finally:
        if db is not None:
            try:
                db.close()
            except Exception:
                pass
