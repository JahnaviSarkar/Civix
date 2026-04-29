# File: backend/routes/verification.py
from flask import Blueprint, request, jsonify
from services.firebase_service import db

verification_bp = Blueprint('verification', __name__)

# 1. Crew uploads the "After" photo
@verification_bp.route('/crew-upload', methods=['POST'])
def crew_upload():
    data = request.json
    complaint_id = data.get('complaint_id')
    photo_url = data.get('photo_url') # Link from Firebase Storage
    
    db.collection('complaints').document(complaint_id).update({
        "after_img_url": photo_url,
        "status": "completed"
    })
    return jsonify({"success": True}), 200

# 2. Admin verifies and sends feedback to Citizen
@verification_bp.route('/admin-verify', methods=['POST'])
def admin_verify():
    data = request.json
    complaint_id = data.get('complaint_id')
    stars = data.get('feedback_stars') # 1-5
    review = data.get('review_text')
    
    db.collection('complaints').document(complaint_id).update({
        "status": "closed",
        "feedback_stars": stars,
        "review_text": review
    })
    return jsonify({"message": "Case closed, feedback sent to citizen"}), 200