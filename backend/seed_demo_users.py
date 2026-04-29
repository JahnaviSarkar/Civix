import firebase_admin
from firebase_admin import credentials, firestore, auth

cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

demo_users = [
    {'email': 'demo-citizen@civix.gov', 'role': 'citizen', 'password': 'citizen123'},
    {'email': 'demo-admin@civix.gov', 'role': 'admin', 'password': 'admin123'},
    {'email': 'demo-crew@civix.gov', 'role': 'crew', 'password': 'crew123'}
]

for u in demo_users:
    try:
        user = auth.get_user_by_email(u['email'])
        uid = user.uid
        print(f"User {u['email']} exists with UID {uid}")
    except auth.UserNotFoundError:
        print(f"Creating user {u['email']}")
        user = auth.create_user(email=u['email'], password=u['password'])
        uid = user.uid

    # Update/Create Firestore document
    db.collection('users').document(uid).set({
        'email': u['email'],
        'role': u['role']
    })
    print(f"Set role {u['role']} in Firestore for {u['email']}")

print("Done setting up demo users.")
