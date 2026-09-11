import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

@pytest.fixture(scope="session", autouse=True)
def initialize_test_database():
    Base.metadata.create_all(bind=engine)
    with TestClient(app):
        yield
