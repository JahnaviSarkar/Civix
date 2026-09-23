import os
import logging
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, List

from app.models.enums import UserRole
from app.config import settings
from app.services.firestore import FirestoreRepository

logger = logging.getLogger("civix.auth")
_firebase_initialized = False

def get_firebase_app():
    global _firebase_initialized
    if _firebase_initialized and firebase_admin._apps:
        return
    if not firebase_admin._apps:
        try:
            if settings.FIREBASE_PROJECT_ID and settings.FIREBASE_CLIENT_EMAIL and settings.FIREBASE_PRIVATE_KEY:
                private_key = settings.FIREBASE_PRIVATE_KEY.strip('"').strip("'").replace('\\n', '\n')
                cred_dict = {
                    "type": "service_account",
                    "project_id": settings.FIREBASE_PROJECT_ID,
                    "client_email": settings.FIREBASE_CLIENT_EMAIL,
                    "private_key": private_key
                }
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin App initialized successfully. [CREDENTIAL SOURCE: Environment Variables (.env / System)]")
            else:
                key_path = os.path.join(os.path.dirname(__file__), "..", "..", "serviceAccountKey.json")
                key_path_abs = os.path.abspath(key_path)
                if os.path.exists(key_path_abs):
                    cred = credentials.Certificate(key_path_abs)
                    firebase_admin.initialize_app(cred)
                    logger.info(f"Firebase Admin App initialized successfully. [CREDENTIAL SOURCE: Key File -> {key_path_abs}]")
                elif settings.FIREBASE_PROJECT_ID:
                    firebase_admin.initialize_app(options={'projectId': settings.FIREBASE_PROJECT_ID})
                    logger.info(f"Firebase Admin App initialized successfully. [CREDENTIAL SOURCE: Default Project Options -> {settings.FIREBASE_PROJECT_ID}]")
        except Exception as e:
            logger.error(f"Firebase Admin Initialization Error: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Authentication service configuration failure: {str(e)}"
            )

    if not firebase_admin._apps:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable: Firebase Admin SDK is not initialized"
        )
    _firebase_initialized = True

security = HTTPBearer(auto_error=True)

def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    get_firebase_app()
    raw_token = token.credentials if (token and token.credentials) else ""
    if isinstance(raw_token, bytes):
        raw_token = raw_token.decode("utf-8", errors="ignore")
    raw_token = str(raw_token).strip()
    
    # Strip quotes and byte prefixes if token string looks like b'demo-citizen' or "demo-citizen"
    if (raw_token.startswith("b'") and raw_token.endswith("'")) or (raw_token.startswith('b"') and raw_token.endswith('"')):
        raw_token = raw_token[2:-1]
    raw_token = raw_token.strip("'").strip('"').strip()

    firebase_uid = None
    email = None
    name = "Civix User"

    # Support local demo tokens (e.g. demo-citizen, demo-crew, demo-admin)
    if raw_token.lower().startswith("demo-"):
        if not settings.ENABLE_DEMO_TOKENS:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Demo authentication is disabled on this server.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        role_str = raw_token.lower().replace("demo-", "").strip()
        if role_str in ["citizen", "crew", "admin"]:
            firebase_uid = f"demo_uid_{role_str}"
            email = f"{role_str}@smartwaste.local"
            name = f"Demo {role_str.capitalize()}"
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid demo role '{role_str}'. Allowed demo roles: citizen, crew, admin",
                headers={"WWW-Authenticate": "Bearer"},
            )

    if not firebase_uid:
        try:
            decoded_token = auth.verify_id_token(raw_token)
            firebase_uid = decoded_token.get("uid")
            email = decoded_token.get("email", "")
            name = decoded_token.get("name", email.split("@")[0] if email else "Civix User")
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Authentication service configuration error: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    def _ensure_user_fields(u: Dict[str, Any], default_uid: str, default_name: str, default_email: str) -> Dict[str, Any]:
        from datetime import datetime, timezone
        u = dict(u)
        if not u.get("id"):
            u["id"] = abs(hash(default_uid)) % 1000000 + 1
        if not u.get("name"):
            u["name"] = default_name or "Civix User"
        if not u.get("email"):
            u["email"] = default_email or f"user_{default_uid[:8]}@smartwaste.local"
        if not u.get("role"):
            u["role"] = "citizen"
        if not u.get("created_at"):
            u["created_at"] = datetime.now(timezone.utc).isoformat()
        if not u.get("firebase_uid"):
            u["firebase_uid"] = default_uid
        return u

    # Retrieve user profile document from Firestore
    try:
        user = FirestoreRepository.get_user_by_uid(firebase_uid)
    except Exception as e:
        logger.error(f"Firestore user lookup error for {firebase_uid}: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database error during user authentication: {str(e)}"
        )

    if not user:
        # Check by email if user profile pre-existed
        if email:
            existing = FirestoreRepository.get_user_by_email(email)
            if existing:
                return _ensure_user_fields(existing, firebase_uid, name, email)

        role_str = UserRole.CITIZEN.value
        if email and "admin" in email:
            role_str = UserRole.ADMIN.value
        elif email and "crew" in email:
            role_str = UserRole.CREW.value

        user = FirestoreRepository.create_user(
            uid=firebase_uid,
            name=name,
            email=email or f"user_{firebase_uid[:8]}@smartwaste.local",
            role=role_str
        )

    return _ensure_user_fields(user, firebase_uid, name, email)

def require_role(allowed_roles: List[UserRole]):
    def role_checker(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = (user.get("role") or "citizen").lower()
        allowed_str = [r.value.lower() if hasattr(r, "value") else str(r).lower() for r in allowed_roles]
        if user_role not in allowed_str:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: Required role {allowed_roles}, your role is {user_role}"
            )
        return user
    return role_checker

require_citizen = require_role([UserRole.CITIZEN, UserRole.ADMIN])
require_crew = require_role([UserRole.CREW, UserRole.ADMIN])
require_admin = require_role([UserRole.ADMIN])
