# File: backend/models/user_model.py
from backend.services.firebase_service import db

def create_user(uid, email, role):
    db.collection("users").document(uid).set({
        "email": email,
        "role": role
    })

def get_user(uid):
    doc = db.collection("users").document(uid).get()
    return doc.to_dict() if doc.exists else None