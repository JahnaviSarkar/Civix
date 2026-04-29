# File: backend/routes/auth.py

from flask import Blueprint, request, jsonify

auth_bp = Blueprint('auth', __name__)

# Temporary local database to bypass Firebase billing
MOCK_USERS = [
    {"email": "test@gmail.com", "role": "citizen", "name": "Test User"},
    {"email": "admin@city.com", "role": "admin", "org_id": "ADMIN777"},
    {"email": "crew1@city.com", "role": "crew", "crew_id": "CREW001"}
]

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    role_type = data.get('role_type')

    # Find user in our local list instead of Firebase
    user = next((u for u in MOCK_USERS if u['email'] == email and u['role'] == role_type), None)

    if user:
        return jsonify({
            "status": "success",
            "role": user['role'],
            "redirect": f"../pages/{user['role']}/dashboard.html"
        }), 200
    
    return jsonify({"error": "User not found. Try test@gmail.com"}), 401