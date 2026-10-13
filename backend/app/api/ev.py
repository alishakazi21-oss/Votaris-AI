from fastapi import APIRouter
from app.services.ev_service import generate_ev_management
from app.models.schemas import EvManagementData

router = APIRouter(tags=["EV Management"])

@router.get("/optimization/ev", response_model=EvManagementData, summary="EV charging station management and optimization")
async def get_ev_management(location: str = "pune") -> EvManagementData:
    return generate_ev_management(location)
