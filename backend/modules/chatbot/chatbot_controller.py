"""
chatbot_controller.py
---------------------
FastAPI router for the Chatbot module (NestJS-style Controller).
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from .chatbot_schema import ChatRequest, ChatResponse
from .chatbot_service import ChatbotService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["Chatbot"])


def _get_chatbot_service(db: AsyncSession = Depends(get_db)) -> ChatbotService:
    """Dependency factory — mirrors NestJS provider injection."""
    return ChatbotService(db)


@router.post(
    "/",
    response_model=ChatResponse,
    summary="Zenda AI assistant (LangGraph RAG Agent)",
)
async def chat_with_bot(
    request: ChatRequest,
    service: ChatbotService = Depends(_get_chatbot_service),
) -> ChatResponse:
    """
    Runs the full LangGraph StateGraph:
      triage_node → [recipe | purchase | info] → ChatResponse

    Returns:
      - `reply`: LLM-generated text.
      - `actions`: List of ADD_TO_CART actions to dispatch on the frontend.
      - `intent`: Detected intent, exposed for frontend debugging.

    Raises 503 if the LLM or DB is unavailable.
    """
    try:
        return await service.get_reply(request)
    except Exception as exc:
        logger.exception("[Controller] Chatbot pipeline failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El asistente no está disponible en este momento. Intenta de nuevo.",
        ) from exc
