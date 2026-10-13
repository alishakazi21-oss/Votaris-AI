from fastapi import APIRouter
from typing import List
from app.services.grid_service import generate_grid_intelligence
from app.models.schemas import GridAlert

router = APIRouter(tags=["Alerts"])

@router.get("/alerts", response_model=List[GridAlert], summary="Active and historical grid alerts")
async def get_alerts(location: str = "pune") -> List[GridAlert]:
    data = generate_grid_intelligence(location)
    return data.alertHistory
