from fastapi import APIRouter
from app.services.weather_service import fetch_weather
from app.models.schemas import WeatherData

router = APIRouter(tags=["Weather"])

@router.get("/weather", response_model=WeatherData, summary="Weather forecast with generation impact")
async def get_weather(location: str = "pune") -> WeatherData:
    return await fetch_weather(location)
