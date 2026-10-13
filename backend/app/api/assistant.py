from fastapi import APIRouter
from app.services.assistant_service import chat
from app.models.schemas import AssistantRequest, AssistantResponse

router = APIRouter(tags=["AI Assistant"])

@router.post("/assistant/chat", response_model=AssistantResponse, summary="AI energy assistant")
async def post_chat(req: AssistantRequest) -> AssistantResponse:
    return await chat(
        messages=req.messages,
        location_id=req.locationId,
        context_data=req.contextData,
        raw_message=req.message,
    )
