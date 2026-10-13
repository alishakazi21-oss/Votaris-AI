from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.upload_service import validate_csv
from app.models.schemas import UploadResponse

router = APIRouter(tags=["Data Management"])

@router.post("/data/upload", response_model=UploadResponse, summary="Upload and validate a CSV dataset")
async def upload_csv(
    file: UploadFile = File(...),
    type: Optional[str] = Form(None),
) -> UploadResponse:
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")
    max_size = 20 * 1024 * 1024  # 20 MB
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(status_code=413, detail="File exceeds 20 MB limit.")
    return validate_csv(file.filename, content)
