# File: backend/middleware/auth_middleware.py
from functools import wraps
from flask import request, jsonify
import firebase_admin.auth as firebase_auth

def verify_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")

        if not token:
            return jsonify({"error": "Token missing"}), 401

        try:
            decoded_token = firebase_auth.verify_id_token(token)
            request.user = decoded_token
        except Exception:
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)
    return decorated