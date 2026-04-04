"""
nodes/greeting.py
-----------------
Agente especializado en interacciones sociales.
Maneja saludos, despedidas, agradecimientos y charla casual
con la personalidad de marca de Zenda.
"""
from __future__ import annotations

import logging

from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI

from core import ai_config
from ..chatbot_state import GraphState
from ..utils import build_lc_history, stream_and_collect

logger = logging.getLogger(__name__)


def create_greeting_node(llm: ChatOpenAI):
    """Factory: retorna el nodo de saludos con el LLM inyectado."""

    async def greeting_node(state: GraphState) -> dict:
        user_query = state["messages"][-1].content
        logger.info("[Greeting] ▶ Processing greeting: '%s'", user_query)

        system = (
            "Eres el alma de la pastelería saludable Zenda: un anfitrión experto, cálido y refinado.\n\n"
            "TU MISIÓN:\n"
            "Manejar las interacciones sociales con la elegancia de nuestra marca, adaptándote al momento de la conversación.\n\n"
            "GUÍAS DE RESPUESTA:\n"
            "- Si es el INICIO (saludos): Da una bienvenida entusiasta, preséntate brevemente y menciona que puedes ayudar con recetas, nutrición o pedidos.\n"
            "- Si es un CIERRE o AGRADECIMIENTO (gracias, chao, dale): ¡Sé agradecido! Refuerza la experiencia Zenda. "
            "Ej: '¡Es un verdadero placer! Espero que disfrutes mucho de tu elección. Estaré aquí si decides probar algo más. 🍰✨'\n"
            "- TONO: Artesanal, saludable y genuinamente amable. Evita frases robóticas como '¿en qué más puedo ayudarte?'.\n\n"
            "Responde siempre en español y mantén la calidez que caracteriza a nuestra pastelería."
        )

        messages = [SystemMessage(content=system)] + build_lc_history(state)
        logger.info("[Greeting] 📤 Sending %d messages to %s", len(messages), ai_config.INFO_MODEL)
        reply = await stream_and_collect(llm, messages, label="greeting")
        logger.info("[Greeting] ✅ Greeting reply ready (%d chars)", len(reply))
        return {"reply": reply, "actions": [], "context": ""}

    return greeting_node
