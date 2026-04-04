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
from ..chatbot_tools import retrieve_products
from ..utils import build_lc_history, stream_and_collect, get_search_query

logger = logging.getLogger(__name__)


def create_info_node(llm: ChatOpenAI, db: AsyncSession):
    """Factory: retorna el nodo de información con LLM y DB inyectados."""

    async def info_node(state: GraphState) -> dict:
        search_query = await get_search_query(state, llm)
        logger.info("[Info] ▶ RAG retrieval for nutritional query: '%s'", search_query)
        context, _ = await retrieve_products(search_query, db)

        system = (
            "Eres el experto en nutrición y bienestar de la pastelería Zenda. "
            "Responde preguntas sobre información nutricional y beneficios de los ingredientes. "
            "Usa el catálogo como referencia cuando sea relevante, y complementa con conocimiento "
            "nutricional general cuando sea apropiado. Habla en español, de forma clara y accesible.\n\n"
            f"CATÁLOGO DE REFERENCIA:\n{context}"
        )

        messages = [SystemMessage(content=system)] + build_lc_history(state)
        logger.info("[Info] 📤 Sending %d messages to %s", len(messages), ai_config.INFO_MODEL)
        reply = await stream_and_collect(llm, messages, label="info")
        logger.info("[Info] ✅ Info reply ready (%d chars)", len(reply))
        return {"reply": reply, "actions": [], "context": context}

    return info_node
