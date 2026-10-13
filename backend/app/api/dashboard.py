from fastapi import APIRouter
from app.services.dashboard_service import generate_dashboard
from app.models.schemas import OverviewDashboardData

router = APIRouter(tags=["Dashboard"])

@router.get("/dashboard", response_model=OverviewDashboardData, summary="Overview dashboard KPIs and time series")
async def get_dashboard(location: str = "pune") -> OverviewDashboardData:
    return generate_dashboard(location)
