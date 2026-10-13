from fastapi import APIRouter
from app.services.microgrid_service import simulate_microgrid
from app.models.schemas import MicrogridConfig, MicrogridPlan

router = APIRouter(tags=["Microgrid"])

@router.post("/microgrid/simulate", response_model=MicrogridPlan, summary="Microgrid simulation and backup planning")
async def post_microgrid(config: MicrogridConfig) -> MicrogridPlan:
    return simulate_microgrid(config)
