"""
nodes/recipe.py
---------------
Agente especializado en recetas y preparación de postres.
Usa RAG para consultar el catálogo y responder con información verificada.
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


def create_recipe_node(llm: ChatOpenAI, db: AsyncSession):
    """Factory: retorna el nodo de recetas con LLM y DB inyectados."""

    async def recipe_node(state: GraphState) -> dict:
        search_query = await get_search_query(state, llm)
        logger.info("[Recipe] ▶ RAG retrieval started for: '%s'", search_query)
        context, _ = await retrieve_products(search_query, db)
        logger.info("[Recipe] ✓ Context retrieved (%d chars)", len(context))

        system = (
            "Eres el asistente de la pastelería saludable Zenda, especializado en recetas. "
            "REGLAS ESTRICTAS:\n"
            "1. Usa ÚNICAMENTE los postres listados en el CATÁLOGO DE FUENTES para responder.\n"
            "2. Cita siempre la fuente: 'Según nuestro catálogo, [nombre del postre]...'\n"
            "3. Si la receta o postre no está en el catálogo, responde EXACTAMENTE: "
            "'Lo siento, no tengo información sobre eso en nuestra base de datos.'\n"
            "4. Habla en español, de forma cálida y sin tecnicismos.\n\n"
            f"CATÁLOGO DE FUENTES:\n{context}"
        )

        messages = [SystemMessage(content=system)] + build_lc_history(state)
        logger.info("[Recipe] 📤 Sending %d messages to %s", len(messages), ai_config.RECIPE_MODEL)
        reply = await stream_and_collect(llm, messages, label="recipe")
        logger.info("[Recipe] ✅ Reply ready (%d chars)", len(reply))
        return {"reply": reply, "actions": [], "context": context}

    return recipe_node
