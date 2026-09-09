from pydantic import BaseModel
from typing import Dict, List

class CategoryStat(BaseModel):
    category: str
    count: int

class SeverityStat(BaseModel):
    severity_range: str
    count: int

class ResolutionTrend(BaseModel):
    date: str
    resolved: int
    submitted: int

class DashboardAnalytics(BaseModel):
    total_complaints: int
    pending_complaints: int
    assigned_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    verified_complaints: int
    rejected_complaints: int
    avg_resolution_hours: float
    verification_rate_pct: float
    category_distribution: List[CategoryStat]
    severity_breakdown: List[SeverityStat]
    trends: List[ResolutionTrend]
