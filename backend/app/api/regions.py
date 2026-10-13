from fastapi import APIRouter
from typing import List
from app.services.regional_service import generate_regional_assets
from app.models.schemas import RegionalAsset

router = APIRouter(tags=["Regional Map"])

@router.get("/regions", response_model=List[RegionalAsset], summary="Regional energy assets for map visualization")
async def get_regions(location: str = "pune") -> List[RegionalAsset]:
    return generate_regional_assets(location)
