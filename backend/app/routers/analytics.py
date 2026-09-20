from fastapi import APIRouter, Depends
from typing import Dict, Any

from app.schemas.analytics import DashboardAnalytics
from app.dependencies.auth import get_current_user, require_admin
from app.services.firestore import FirestoreRepository

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview")
@router.get("/stats")
def get_analytics_overview(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    return FirestoreRepository.get_analytics_overview()

@router.get("/dashboard", response_model=DashboardAnalytics)
def get_dashboard_analytics(
    current_user: Dict[str, Any] = Depends(require_admin)
):
    overview = FirestoreRepository.get_analytics_overview()
    return DashboardAnalytics(
        total_complaints=overview["total_complaints"],
        pending_complaints=overview["pending_complaints"],
        assigned_complaints=overview["assigned_complaints"],
        in_progress_complaints=overview["in_progress_complaints"],
        resolved_complaints=overview["resolved_complaints"],
        verified_complaints=overview["verified_complaints"],
        rejected_complaints=overview["rejected_complaints"],
        avg_resolution_hours=overview["avg_resolution_hours"],
        verification_rate_pct=overview["verification_rate_pct"],
        category_distribution=overview["category_distribution"],
        severity_breakdown=overview["severity_breakdown"],
        trends=overview["trends"]
    )
