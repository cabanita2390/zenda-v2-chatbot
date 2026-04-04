"""
nodes/triage.py
---------------
Clasificador de intenciones del usuario.
Analiza el mensaje y determina a qué nodo especializado debe dirigirse.
"""
from __future__ import annotations

import json
import logging

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI

from core import ai_config
from ..chatbot_state import GraphState
from ..utils import clean_json_response

logger = logging.getLogger(__name__)


def create_triage_node(llm: ChatOpenAI):
    """Factory: retorna el nodo de triage con el LLM inyectado."""

    async def triage_node(state: GraphState) -> dict:
        user_query = state["messages"][-1].content
        logger.info("[Triage] ── New request ─────────────────────────────")
        logger.info("[Triage] 📥 User query: '%s'", user_query)
        logger.info("[Triage] 📤 Sending to model: %s", ai_config.TRIAGE_MODEL)

        # Extraemos los últimos 4 mensajes para dar contexto al clasificador
        recent_messages = state["messages"][-4:-1]
        context_str = ""
        for m in recent_messages:
            role_label = "Bot" if m.role == "assistant" else "Usuario"
            context_str += f"{role_label}: {m.content}\n"

        prompt = (
            "Eres un experto clasificador de intenciones para la pastelería Zenda.\n\n"
            "Categorías:\n"
            "- recipe: El usuario pregunta por ingredientes, cómo se hace algo o pide una receta.\n"
            "- purchase: El usuario quiere comprar, añadir al carrito, usa verbos imperativos ('dame', 'pon', 'agrega', 'quiero'), confirma una compra ('Sí', 'Dale') o da una cantidad ('2', 'tres').\n"
            "- info: Preguntas informativas generales sobre qué es un producto, qué postres hay, o curiosidades saludables.\n"
            "- track_order: El usuario quiere saber el estado de su pedido, pregunta dónde está su pedido, o proporciona un código o ID de seguimiento.\n"
            "- greeting: Saludos, despedidas o charla casual.\n\n"
            "HISTORIAL RECIENTE (Para contexto):\n"
            f"{context_str}\n"
            "REGLA DE ORO: Si el Bot hizo una pregunta de compra anteriormente, las respuestas cortas del Usuario "
            "como 'Sí', 'No' o números deben clasificarse como 'purchase'.\n\n"
            "Responde SOLO con JSON: {\"intent\": \"<categoria>\"}\n\n"
            f"Mensaje actual del Usuario: {user_query}"
        )

        response = await llm.ainvoke([HumanMessage(content=prompt)])
        logger.debug("[Triage] 📨 Raw model response: %s", response.content)

        try:
            clean_json = clean_json_response(response.content)
            data = json.loads(clean_json)
            intent = data.get("intent", "info")
        except (json.JSONDecodeError, AttributeError):
            logger.warning("[Triage] Failed to parse JSON intent, defaulting to 'info'")
            intent = "info"

        if intent not in ("recipe", "purchase", "info", "greeting", "track_order"):
            logger.warning("[Triage] Unknown intent '%s', defaulting to 'info'", intent)
            intent = "info"

        logger.info("[Triage] ✓ Intent classified → '%s'", intent)
        return {"intent": intent}

    return triage_node
