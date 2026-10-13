from fastapi import APIRouter
from app.services.grid_service import generate_grid_intelligence
from app.models.schemas import GridIntelligenceData

router = APIRouter(tags=["Grid Intelligence"])

@router.get("/grid/imbalance", response_model=GridIntelligenceData, summary="Grid imbalance detection and 48h risk timeline")
async def get_grid_imbalance(location: str = "pune") -> GridIntelligenceData:
    return generate_grid_intelligence(location)
