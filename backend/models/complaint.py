# File: backend/models/complaint_model.py
from backend.services.firebase_service import db

def create_complaint(data):
    doc_ref = db.collection("complaints").add(data)
    return doc_ref[1].id

def get_complaints_by_user(user_id):
    docs = db.collection("complaints").where("user_id", "==", user_id).stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

def get_all_complaints():
    docs = db.collection("complaints").stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

def update_complaint(complaint_id, data):
    db.collection("complaints").document(complaint_id).update(data)