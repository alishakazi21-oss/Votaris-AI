from fastapi import APIRouter
from app.services.scenario_service import simulate_scenario
from app.models.schemas import ScenarioInputs, ScenarioResult

router = APIRouter(tags=["Scenarios"])

@router.post("/scenarios/simulate", response_model=ScenarioResult, summary="What-if scenario simulation")
async def post_scenario(inputs: ScenarioInputs) -> ScenarioResult:
    return simulate_scenario(inputs)
