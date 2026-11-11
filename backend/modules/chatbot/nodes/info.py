"""
nodes/info.py
-------------
Agente especializado en información nutricional y beneficios.
Responde preguntas generales sobre los productos de Zenda.
"""
from __future__ import annotations

import logging

from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from core import ai_config
from ..chatbot_state import GraphState
from ..chatbot_tools import get_all_products
from ..utils import build_lc_history, stream_and_collect, format_catalog, SCOPE_RULES

logger = logging.getLogger(__name__)


def create_info_node(llm: ChatOpenAI, db: AsyncSession):
    """Factory: retorna el nodo de información con LLM y DB inyectados."""

    async def info_node(state: GraphState) -> dict:
        # El catálogo es pequeño: se envía COMPLETO para que preguntas como
        # "¿qué cheesecakes tienen?" o "¿qué es vegano?" no omitan productos
        # (la búsqueda vectorial solo devolvía los 3 más parecidos).
        context = format_catalog(await get_all_products(db))
        logger.info("[Info] ▶ Answering with full catalog")

        system = (
            "Eres el experto en nutrición y bienestar de la pastelería Zenda. "
            "Responde preguntas sobre nuestros postres, sus ingredientes y beneficios. "
            "Puedes complementar con conocimiento nutricional general SOLO si se relaciona con nuestros postres "
            "o con la dieta del cliente. Habla en español, de forma clara, breve y accesible.\n\n"
            "REGLAS DEL CATÁLOGO:\n"
            "1. Cuando listes productos (por tipo, etiqueta o dieta), incluye TODOS los del catálogo que cumplan, sin omitir ninguno.\n"
            "2. Nunca inventes productos, precios ni etiquetas que no estén en el catálogo.\n\n"
            f"{SCOPE_RULES}\n\n"
            f"{context}"
        )

        messages = [SystemMessage(content=system)] + build_lc_history(state)
        logger.info("[Info] 📤 Sending %d messages to %s", len(messages), ai_config.INFO_MODEL)
        reply = await stream_and_collect(llm, messages, label="info")
        logger.info("[Info] ✅ Info reply ready (%d chars)", len(reply))
        return {"reply": reply, "actions": [], "context": context}

    return info_node
