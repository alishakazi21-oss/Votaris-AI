from fastapi import APIRouter
from app.services.model_lab_service import get_model_metrics
from app.models.schemas import ModelLabData

router = APIRouter(tags=["Model Lab"])

@router.get("/models/metrics", response_model=ModelLabData, summary="Model evaluation metrics and comparisons")
async def get_model_metrics_endpoint(location: str = "pune", source: str = "solar") -> ModelLabData:
    return get_model_metrics(location, source)
