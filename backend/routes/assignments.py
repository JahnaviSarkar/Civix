# File: backend/routes/assignments.py

from flask import Blueprint, request, jsonify
from services.firebase_service import db

assignments_bp = Blueprint('assignments', __name__)

@assignments_bp.route('/assign', methods=['POST'])
def assign_crew():
    data = request.json
    complaint_id = data.get('complaint_id')
    crew_id = data.get('crew_id')

    try:
        db.collection('complaints').document(complaint_id).update({
            "crew_id": crew_id,
            "status": "assigned"
        })
        return jsonify({"message": f"Complaint assigned to Crew {crew_id}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400