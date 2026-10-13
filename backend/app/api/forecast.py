from fastapi import APIRouter
from app.services.forecast_service import generate_forecast
from app.models.schemas import ForecastResult, ForecastRequest

router = APIRouter(tags=["Forecast"])

@router.post("/forecast", response_model=ForecastResult, summary="AI energy forecast")
async def post_forecast(req: ForecastRequest) -> ForecastResult:
    return generate_forecast(req.locationId, req.source, req.horizon)

@router.get("/forecast/history", summary="Placeholder: forecast run history")
async def get_forecast_history(location: str = "pune"):
    return {"message": "Forecast history stored in DB (demo mode: no past runs yet)", "location": location}
