"""
chatbot_service.py
------------------
Orchestrates the LangGraph agent with LangFuse observability.

Responsibilities:
  - Instantiate LangFuse CallbackHandler (non-blocking if keys are missing).
  - Build the compiled LangGraph per request (graph is stateless; DB session varies).
  - Invoke the graph and return the final (reply, actions, intent) tuple.
"""
from __future__ import annotations

import logging
import os
from typing import Optional

from langfuse.langchain import CallbackHandler as LangFuseCallbackHandler
from langchain_core.runnables import RunnableConfig
from sqlalchemy.ext.asyncio import AsyncSession

from .chatbot_schema import ChatRequest, ChatResponse
from .chatbot_graph import build_graph

logger = logging.getLogger(__name__)

def _is_low_value_message(text: str) -> bool:
    import re
    import unicodedata

    # 1. NORMALIZACIÓN TOTAL (Quitar tildes, puntuación y pasar a minúsculas)
    t = text.lower().strip()
    # Quitar tildes (ej: 'sí' -> 'si')
    t = "".join(c for c in unicodedata.normalize('NFD', t) if unicodedata.category(c) != 'Mn')
    # Quitar puntuación
    t_clean = re.sub(r'[^\w\s]', '', t).strip()

    # NUEVA REGLA: Si es un número solo, NO es low-value (es una cantidad)
    if t_clean.isdigit():
        return False

    # 2. GREETINGS Y CORTESÍA (Siempre van al grafo)
    greetings = {"hola", "buenas", "buen dia", "saludos", "hello", "hi", "hey", "gracias", "chau", "adios", "bye"}
    if t_clean in greetings:
        return False    

    # 3. TRIVIAL (Cosas que realmente no aportan nada)
    # Quitamos 'gracias' y despedidas para que pasen al grafo y el bot sea amable.
    trivial_set = {
        "aaa", "test", "asdf", "hola123"
    }
    if t_clean in trivial_set:
        return True

    # 4. PALABRAS DE VALOR (Añadimos variantes y confirmaciones)
    valuable_keywords = [
        "si", "no", "agrega", "pon", "quiero", "compra", "suma", "dale", "vale",
        "precio", "tiene", "ingredientes", "mousse", "torta", "postre", "info", "maracuya"
    ]

    # Si contiene CUALQUIER palabra de valor, NO es low-value
    # Usamos búsqueda por palabra completa para ser más precisos
    words = t_clean.split()
    if any(k in words for k in valuable_keywords) or any(k in t_clean for k in valuable_keywords):
        return False

    return False



def _langfuse_handler() -> Optional[LangFuseCallbackHandler]:
    """
    Inicializa el handler de LangFuse usando variables de entorno.
    Compatible con versiones nuevas de LangFuse (sin pasar keys al constructor).
    """

    import os

    public_key = os.getenv("LANGFUSE_PUBLIC_KEY")
    secret_key = os.getenv("LANGFUSE_SECRET_KEY")

    # Validación básica
    if not public_key or not secret_key:
        logger.warning(
            "[LangFuse] Keys no configuradas. Tracing DESACTIVADO."
        )
        return None

    try:
        # ⚠️ En versiones nuevas NO se pasan keys aquí
        handler = LangFuseCallbackHandler()

        logger.info("[LangFuse] ✅ Handler inicializado correctamente")
        return handler

    except Exception as exc:
        logger.warning(
            "[LangFuse] ❌ Error inicializando handler: %s",
            exc
        )
        return None



class ChatbotService:
    """
    Service layer for the LangGraph-powered Zenda chatbot.
    One instance per HTTP request (injected via FastAPI Depends).
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_reply(self, request: ChatRequest) -> ChatResponse:
        """
        Run the full LangGraph reasoning chain and return a structured response.
        """
        print("\n[ChatbotService] 📥 NUEVA PETICIÓN RECIBIDA 📥", flush=True)
                
        user_message = request.messages[-1].content

        print(f"🧪 [DEBUG] Mensaje recibido: '{user_message}'", flush=True)

        if _is_low_value_message(user_message):
            print("⛔ [DEBUG] Entró en low_value_message", flush=True)
            return ChatResponse(
                reply="Entendido. ¿Hay algo más en lo que pueda ayudarte?",
                actions=[],
                intent="greeting",
            )   
        
        # 1. Build the compiled graph for this request (captures db in closures)
        graph = build_graph(self.db)

        # 2. Prepare initial state
        initial_state = {
            "messages": request.messages,
            "actions": [],
        }

        # 3. Attach LangFuse callback if configured
        lf_handler = _langfuse_handler()
        if lf_handler:
            config = RunnableConfig(
                callbacks=[lf_handler],
                tags=["zenda", "chatbot", "rag"],
                metadata={
                    "component": "chatbot_service",
                },
        )
        else:
            config = RunnableConfig()

        # 4. Execute the graph
        logger.info("[ChatbotService] Invoking LangGraph...")
        print("🚀 [DEBUG] Ejecutando grafo...", flush=True)
        final_state = await graph.ainvoke(initial_state, config=config)
        print("✅ [DEBUG] Grafo ejecutado. Estado final:", final_state, flush=True) 

        reply = final_state.get("reply") or "Lo siento, no pude generar una respuesta."
        actions = final_state.get("actions") or []
        intent = final_state.get("intent")

        logger.info(
            "[ChatbotService] Done. intent=%s actions=%d",
            intent,
            len(actions),
        )
        return ChatResponse(reply=reply, actions=actions, intent=intent)
