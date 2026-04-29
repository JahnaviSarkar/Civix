import os
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore, auth

app = Flask(__name__)
CORS(app)

# Initialize Firebase Admin
try:
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred)
except Exception as e:
    print(f"Firebase Init Error: {e}")

db = firestore.client()

def require_auth(role=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Unauthorized'}), 401
            
            token = auth_header.split('Bearer ')[1]
            try:
                decoded_token = auth.verify_id_token(token)
                uid = decoded_token['uid']
                
                user_doc = db.collection('users').document(uid).get()
                if not user_doc.exists:
                    return jsonify({'error': 'User not found in database'}), 403
                
                user_data = user_doc.to_dict()
                user_role = user_data.get('role')
                
                if role and user_role != role:
                    return jsonify({'error': 'Forbidden: Insufficient privileges'}), 403
                
                request.user = {'uid': uid, **user_data}
                return f(*args, **kwargs)
            except Exception as e:
                return jsonify({'error': str(e)}), 401
        return decorated_function
    return decorator

@app.route('/login', methods=['POST'])
def login():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    
    token = auth_header.split('Bearer ')[1]
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']
        user_doc = db.collection('users').document(uid).get()
        if not user_doc.exists:
            return jsonify({'error': 'User role not found'}), 404
        return jsonify(user_doc.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    uid = data.get('uid')
    role = data.get('role', 'citizen')
    email = data.get('email')
    
    if not uid:
        return jsonify({'error': 'UID is required'}), 400
        
    try:
        db.collection('users').document(uid).set({
            'email': email,
            'role': role,
            'created_at': firestore.SERVER_TIMESTAMP
        })
        return jsonify({'message': 'User registered successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/citizen_submit', methods=['POST'])
@require_auth(role='citizen')
def citizen_submit():
    data = request.json
    try:
        complaint_ref = db.collection('complaints').document()
        complaint_ref.set({
            'citizen_id': request.user['uid'],
            'category': data.get('category', 'Other'),
            'description': data.get('description'),
            'location': data.get('location'),
            'image_url': data.get('image_url', ''),
            'status': 'pending',
            'created_at': firestore.SERVER_TIMESTAMP
        })
        return jsonify({'message': 'Complaint submitted successfully', 'id': complaint_ref.id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/crew_upload', methods=['POST'])
@require_auth(role='crew')
def crew_upload():
    data = request.json
    complaint_id = data.get('complaint_id')
    after_image_url = data.get('after_image_url')
    
    if not complaint_id or not after_image_url:
        return jsonify({'error': 'Missing data'}), 400
        
    try:
        db.collection('complaints').document(complaint_id).update({
            'after_image_url': after_image_url,
            'status': 'completed',
            'crew_id': request.user['uid'],
            'completed_at': firestore.SERVER_TIMESTAMP
        })
        return jsonify({'message': 'Work uploaded and marked completed'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin_verify', methods=['POST'])
@require_auth(role='admin')
def admin_verify():
    data = request.json
    complaint_id = data.get('complaint_id')
    feedback_stars = data.get('feedback_stars')
    review_text = data.get('review_text')
    
    if not complaint_id or not feedback_stars:
        return jsonify({'error': 'Missing data'}), 400
        
    try:
        db.collection('complaints').document(complaint_id).update({
            'status': 'verified',
            'feedback_stars': feedback_stars,
            'review_text': review_text,
            'verified_by': request.user['uid'],
            'verified_at': firestore.SERVER_TIMESTAMP
        })
        return jsonify({'message': 'Case closed and verified successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin_reject', methods=['POST'])
@require_auth(role='admin')
def admin_reject():
    data = request.json
    complaint_id = data.get('complaint_id')
    review_text = data.get('review_text')
    
    if not complaint_id:
        return jsonify({'error': 'Missing complaint_id'}), 400
        
    try:
        db.collection('complaints').document(complaint_id).update({
            'status': 'in-progress',
            'admin_reject_reason': review_text,
            'after_image_url': '',
            'rejected_at': firestore.SERVER_TIMESTAMP
        })
        return jsonify({'message': 'Task rejected and sent back to crew'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/citizen/complaints', methods=['GET'])
@require_auth(role='citizen')
def get_citizen_complaints():
    try:
        docs = db.collection('complaints').where('citizen_id', '==', request.user['uid']).stream()
        complaints = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            if 'created_at' in data and data['created_at']:
                data['created_at'] = data['created_at'].isoformat()
            if 'completed_at' in data and data['completed_at']:
                data['completed_at'] = data['completed_at'].isoformat()
            if 'verified_at' in data and data['verified_at']:
                data['verified_at'] = data['verified_at'].isoformat()
            complaints.append(data)
            
        # Sort by created_at descending in memory to avoid Firestore index requirements
        complaints.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return jsonify(complaints), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/crew/complaints', methods=['GET'])
@require_auth(role='crew')
def get_crew_complaints():
    try:
        docs = db.collection('complaints').where('status', 'in', ['pending', 'in-progress']).stream()
        complaints = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            if 'created_at' in data and data['created_at']:
                data['created_at'] = data['created_at'].isoformat()
            complaints.append(data)
            
        # Sort by created_at descending in memory to avoid Firestore index requirements
        complaints.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return jsonify(complaints), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/complaints', methods=['GET'])
@require_auth(role='admin')
def get_admin_complaints():
    try:
        docs = db.collection('complaints').stream()
        complaints = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            if 'created_at' in data and data['created_at']:
                data['created_at'] = data['created_at'].isoformat()
            if 'completed_at' in data and data['completed_at']:
                data['completed_at'] = data['completed_at'].isoformat()
            if 'verified_at' in data and data['verified_at']:
                data['verified_at'] = data['verified_at'].isoformat()
            complaints.append(data)
            
        # Sort by created_at descending in memory
        complaints.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return jsonify(complaints), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000)