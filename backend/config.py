# File: backend/config.py
import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "supersecretkey")
    FIREBASE_CREDENTIALS = os.environ.get("FIREBASE_CREDENTIALS", "serviceAccountKey.json")