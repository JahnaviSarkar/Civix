# File: backend/services/firebase_service.py

import firebase_admin
from firebase_admin import credentials, firestore, auth, storage
import os

# Path to your service account key
current_dir = os.path.dirname(os.path.abspath(__file__))
key_path = os.path.join(current_dir, '..', 'serviceAccountKey.json')

# Initialize Firebase Admin SDK
cred = credentials.Certificate(key_path)
firebase_admin.initialize_app(cred, {
    'storageBucket': 'your-project-id.appspot.com' # Replace with your Firebase bucket URL
})

db = firestore.client()
bucket = storage.bucket()

class FirebaseService:
    @staticmethod
    def verify_token(id_token):
        try:
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except Exception as e:
            return None

    @staticmethod
    def get_user_role(uid):
        user_doc = db.collection('users').document(uid).get()
        if user_doc.exists:
            return user_doc.to_dict().get('role')
        return None