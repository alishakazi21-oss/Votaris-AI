from fastapi import APIRouter
from app.services.cost_carbon_service import generate_cost_carbon
from app.models.schemas import CostCarbonData

router = APIRouter(tags=["Cost & Carbon"])

@router.get("/analytics/cost-carbon", response_model=CostCarbonData, summary="Cost and carbon analytics")
async def get_cost_carbon(location: str = "pune") -> CostCarbonData:
    return generate_cost_carbon(location)
