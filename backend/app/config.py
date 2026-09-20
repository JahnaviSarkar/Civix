import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "CIVIX Smart Waste Management Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"

    def model_post_init(self, __context) -> None:
        if not self.PROJECT_NAME or not self.PROJECT_NAME.strip():
            self.PROJECT_NAME = "CIVIX Smart Waste Management Platform"
        if not self.VERSION or not self.VERSION.strip():
            self.VERSION = "2.0.0"
        if not self.API_V1_STR or not self.API_V1_STR.strip():
            self.API_V1_STR = "/api"

    # Firebase Admin Credentials
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "smart-waste-app-5b0ee")
    FIREBASE_CLIENT_EMAIL: str = os.getenv("FIREBASE_CLIENT_EMAIL", "")
    FIREBASE_PRIVATE_KEY: str = os.getenv("FIREBASE_PRIVATE_KEY", "")

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:8000"
    ]

    # Security & Demo Flags (Default to False in Production)
    ENABLE_DEMO_TOKENS: bool = os.getenv("ENABLE_DEMO_TOKENS", "false").lower() in ("true", "1", "yes")
    ENABLE_DEMO_SEEDING: bool = os.getenv("ENABLE_DEMO_SEEDING", "false").lower() in ("true", "1", "yes")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
