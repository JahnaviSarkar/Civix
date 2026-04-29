# File: backend/routes/complaints.py

from flask import Blueprint, request, jsonify
from services.firebase_service import db
import datetime

complaints_bp = Blueprint('complaints', __name__)

@complaints_bp.route('/submit', methods=['POST'])
def submit_complaint():
    data = request.json
    try:
        complaint_data = {
            "citizen_id": data.get('uid'),
            "description": data.get('description'),
            "location": data.get('location'),
            "status": "pending", # Initial status
            "created_at": datetime.datetime.now(),
            "crew_id": None,
            "after_img_url": None,
            "feedback_stars": None,
            "review_text": None
        }
        
        doc_ref = db.collection('complaints').add(complaint_data)
        return jsonify({"message": "Complaint raised", "id": doc_ref[1].id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# File: backend/routes/complaints.py

@complaints_bp.route('/citizen-submit', methods=['POST'])
def submit():
    data = request.json
    # Just print to terminal to verify it arrived
    print(f"Received Complaint: {data['title']}") 
    
    # In a real setup, you'd save to Firestore here. 
    # For now, let's just return success so your frontend works.
    return jsonify({"status": "success", "message": "Complaint received"}), 201