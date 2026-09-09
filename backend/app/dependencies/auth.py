import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import os

from app.database import get_db
from app.models.user import User, UserRole
from app.config import settings

# Initialize Firebase Admin SDK if not already initialized
if not firebase_admin._apps:
    try:
        # Check if environment credentials exist
        if settings.FIREBASE_PROJECT_ID and settings.FIREBASE_CLIENT_EMAIL and settings.FIREBASE_PRIVATE_KEY:
            private_key = settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n')
            cred_dict = {
                "type": "service_account",
                "project_id": settings.FIREBASE_PROJECT_ID,
                "client_email": settings.FIREBASE_CLIENT_EMAIL,
                "private_key": private_key
            }
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
        else:
            # Fallback to serviceAccountKey.json if present locally
            key_path = os.path.join(os.path.dirname(__file__), "..", "..", "serviceAccountKey.json")
            if os.path.exists(key_path):
                cred = credentials.Certificate(key_path)
                firebase_admin.initialize_app(cred)
            else:
                # Initialize default app for project
                firebase_admin.initialize_app(options={'projectId': settings.FIREBASE_PROJECT_ID})
    except Exception as e:
        print(f"Warning: Firebase Admin Initialization Warning: {e}")

security = HTTPBearer(auto_error=True)

def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    raw_token = token.credentials
    firebase_uid = None
    email = None
    name = "Civix User"

    # Support local demo tokens (e.g. demo-citizen, demo-crew, demo-admin)
    if raw_token.startswith("demo-"):
        role_str = raw_token.replace("demo-", "")
        if role_str in ["citizen", "crew", "admin"]:
            firebase_uid = f"demo_uid_{role_str}"
            email = f"{role_str}@smartwaste.local"
            name = f"Demo {role_str.capitalize()}"
    
    if not firebase_uid:
        try:
            decoded_token = auth.verify_id_token(raw_token)
            firebase_uid = decoded_token.get("uid")
            email = decoded_token.get("email", "")
            name = decoded_token.get("name", email.split("@")[0] if email else "Civix User")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # Find or auto-sync user in PostgreSQL DB
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        # Assign role based on demo or default to citizen
        role_enum = UserRole.CITIZEN
        if "admin" in email:
            role_enum = UserRole.ADMIN
        elif "crew" in email:
            role_enum = UserRole.CREW

        user = User(
            firebase_uid=firebase_uid,
            email=email,
            name=name,
            role=role_enum
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user

def require_role(allowed_roles: list[UserRole]):
    def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: Required role {allowed_roles}, your role is {user.role.value}"
            )
        return user
    return role_checker

require_citizen = require_role([UserRole.CITIZEN, UserRole.ADMIN])
require_crew = require_role([UserRole.CREW, UserRole.ADMIN])
require_admin = require_role([UserRole.ADMIN])
