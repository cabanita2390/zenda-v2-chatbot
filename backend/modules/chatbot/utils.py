"""
chatbot/utils.py
----------------
Funciones compartidas por todos los nodos del grafo LangGraph.
Incluye: conversión de historial, streaming de LLM, limpieza JSON,
reescritura de consultas y reranking de productos.
"""
from __future__ import annotations

import json
import logging
import re
from typing import List

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI

from core.ai_config import HISTORY_WINDOW
from .chatbot_state import GraphState

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# Historial
# ──────────────────────────────────────────────────────────────────────────────

def build_lc_history(state: GraphState) -> List:
    """Convert ConversationHistory → LangChain message list (last N turns)."""
    lc = []
    mensajes_a_procesar = state["messages"][-HISTORY_WINDOW:]

    for msg in mensajes_a_procesar:
        if msg.role == "user":
            lc.append(HumanMessage(content=msg.content))
        else:
            lc.append(AIMessage(content=msg.content))

    logger.debug("[History] Built %d LangChain messages from %d total", len(lc), len(state["messages"]))
    return lc


# ──────────────────────────────────────────────────────────────────────────────
# Streaming
# ──────────────────────────────────────────────────────────────────────────────

async def stream_and_collect(llm: ChatOpenAI, messages: list, label: str) -> str:
    """
    Stream tokens from the LLM, log each chunk at DEBUG level,
    and return the full assembled reply.
    """
    full_reply = ""
    logger.info("[%s] ▶ Starting LLM stream (model=%s)", label, llm.model_name)
    async for chunk in llm.astream(messages):
        token = chunk.content
        if token:
            full_reply += token
    logger.info("[%s] ✓ Stream complete — %d chars generated", label, len(full_reply))
    return full_reply


# ──────────────────────────────────────────────────────────────────────────────
# JSON
# ──────────────────────────────────────────────────────────────────────────────

def clean_json_response(text: str) -> str:
    """Elimina bloques de código markdown y asegura un JSON limpio."""
    text = text.strip()
    text = re.sub(r"```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```", "", text)
    return text.strip()


# ──────────────────────────────────────────────────────────────────────────────
# Query Rewriting
# ──────────────────────────────────────────────────────────────────────────────

async def get_search_query(state: GraphState, llm: ChatOpenAI) -> str:
    """
    Query Rewriting: Transforma el historial en una consulta de búsqueda única.
    Maneja referencias como 'esta', 'la segunda', 'Dame 3'.
    """
    history = build_lc_history(state)
    last_user_msg = state["messages"][-1].content

    prompt = (
        "Eres un REESCRITOR de consultas de búsqueda para la pastelería Zenda.\n"
        "Tu única tarea es extraer el TEMA o PRODUCTO de interés del usuario.\n\n"
        "REGLAS:\n"
        "1. NO intentes responder al usuario.\n"
        "2. Si el usuario dice un número solo (ej: 'Dame 3'), busca el nombre del producto que se mencionó ANTES en el historial y devuélvelo.\n"
        "3. NO devuelvas 'ID 3' o 'Producto 3' a menos que el usuario sea explícito.\n"
        "4. Si el usuario pregunta por 'postres' en general, devuelve simplemente 'postres'.\n"
        "5. Extrae SOLO las palabras que el usuario dijo. NO completes, NO añadas sabores, variantes ni detalles que el usuario NO mencionó explícitamente.\n\n"
        "Responde ÚNICAMENTE con el nombre del producto (máximo 4 palabras)."
    )

    response = await llm.ainvoke([SystemMessage(content=prompt)] + history)
    query = response.content.strip().replace('"', '').replace('.', '')
    logger.info("[Query Rewrite] '%s' -> '%s'", last_user_msg, query)
    return query


# ──────────────────────────────────────────────────────────────────────────────
# Reranker
# ──────────────────────────────────────────────────────────────────────────────

async def rerank_products(query: str, products: List, llm: ChatOpenAI) -> List:
    """
    Reranker (Juez): El LLM valida si alguno de los productos recuperados de
    la base de datos vectorial coincide de verdad con la intención del usuario.
    """
    if not products:
        return []

    catalog_str = "\n".join([f"- {p.name} (ID: {p.id})" for p in products])

    prompt = (
        f"El usuario busca: '{query}'\n\n"
        f"Candidatos encontrados en la DB:\n{catalog_str}\n\n"
        "REGLAS CRÍTICAS:\n"
        "1. Si la búsqueda es un término GENÉRICO (ej: 'Cheesecake', 'Mousse', 'Tarta') y hay VARIOS candidatos de ese tipo, devúelvelos TODOS para que el usuario elija.\n"
        "2. Si la búsqueda incluye un sabor ESPECÍFICO (ej: 'Cheesecake de Uchuva'), valida solo el que coincide exactamente.\n"
        "3. Mantén la regla estricta de las frutas: Si pide 'maracuyá', NO aceptes 'uchuva'.\n"
        "4. Responde ÚNICAMENTE con los IDs de los productos separados por comas. Si no hay coincidencia, responde 'NONE'.\n"
        "Respuesta (solo IDs o NONE):"
    )

    response = await llm.ainvoke([SystemMessage(content=prompt)])
    decision = response.content.strip().upper()

    if "NONE" in decision:
        logger.warning("[Reranker] ❌ Ningún producto fue validado por el juez.")
        return []

    validated_ids = [int(n) for n in re.findall(r'\d+', decision)]
    validated = [p for p in products if p.id in validated_ids]
    logger.info("[Reranker] ✅ Juez validó IDs: %s", [p.id for p in validated])
    return validated
