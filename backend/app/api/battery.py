from fastapi import APIRouter
from app.services.battery_service import optimize_battery
from app.models.schemas import BatteryConfig, BatteryOptimizationResult

router = APIRouter(tags=["Battery Optimization"])

@router.post("/optimization/battery", response_model=BatteryOptimizationResult, summary="Battery dispatch optimization")
async def post_battery_optimization(config: BatteryConfig) -> BatteryOptimizationResult:
    return optimize_battery(config)
