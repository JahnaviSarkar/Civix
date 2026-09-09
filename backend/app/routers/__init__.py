from app.routers.auth import router as auth_router
from app.routers.complaints import router as complaints_router
from app.routers.crew import router as crew_router
from app.routers.admin import router as admin_router
from app.routers.analytics import router as analytics_router
from app.routers.users import router as users_router

__all__ = [
    "auth_router",
    "complaints_router",
    "crew_router",
    "admin_router",
    "analytics_router",
    "users_router"
]
