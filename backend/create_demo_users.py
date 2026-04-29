import firebase_admin
from firebase_admin import credentials, auth, firestore

cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

users = [
    {"email": "citizen@smartwaste.local", "password": "password123", "role": "citizen"},
    {"email": "admin@smartwaste.local", "password": "password123", "role": "admin"},
    {"email": "crew@smartwaste.local", "password": "password123", "role": "crew"}
]

for u in users:
    try:
        try:
            user = auth.get_user_by_email(u["email"])
            print(f"User {u['email']} already exists. Updating password...")
            auth.update_user(user.uid, password=u["password"])
        except Exception as e:
            # Assuming UserNotFoundError if not found
            user = auth.create_user(email=u["email"], password=u["password"])
            print(f"Created {u['email']}")
            
        db.collection('users').document(user.uid).set({
            'email': u["email"],
            'role': u["role"]
        })
        print(f"Set firestore role for {u['role']}")
    except Exception as e:
        print(f"Error for {u['email']}: {e}")
