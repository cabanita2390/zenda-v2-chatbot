"""
chatbot_graph.py
----------------
LangGraph StateGraph definition for the Zenda AI assistant.

Flow:
  START → triage_node → [recipe_node | purchase_node | info_node] → END

Observability:
  LangFuse CallbackHandler is injected at graph execution time (in chatbot_service.py),
  so every LLM call automatically captures thoughts → actions → observations.

Token streaming:
  LLM calls use .astream() internally; tokens are collected and logged at DEBUG
  level so engineers can observe the generation without exposing SSE to the frontend.
"""
from __future__ import annotations

import json
import logging
import os
from typing import List

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from sqlalchemy.ext.asyncio import AsyncSession

from core import ai_config
from .chatbot_state import GraphState
from .chatbot_tools import retrieve_products, resolve_product_ids
from .chatbot_schema import CartAction

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _build_lc_history(state: GraphState) -> List:
    """Convert ConversationHistory → LangChain message list (last N turns)."""
    # 1. Traemos la configuración de la ventana de memoria
    from core.ai_config import HISTORY_WINDOW 
    
    # [DEBUG] ¿Cuántos mensajes hay en total antes de recortar?
    print(f"\n🔍 [DEBUG Historial] Mensajes totales recibidos: {len(state['messages'])}", flush=True)
    print(f"🔍 [DEBUG Historial] Ventana configurada (HISTORY_WINDOW): {HISTORY_WINDOW}", flush=True)

    lc = []
    
    # 2. Seleccionamos solo los últimos N mensajes usando 'slicing' de Python
    mensajes_a_procesar = state["messages"][-HISTORY_WINDOW:]
    print(f"🔍 [DEBUG Historial] Procesando los últimos {len(mensajes_a_procesar)} mensajes...", flush=True)

    # 3. Iteramos para transformar el formato de Zenda al de LangChain
    for i, msg in enumerate(mensajes_a_procesar):
        # [DEBUG] Ver el rol y un pedacito del texto para no saturar la pantalla
        resumen_texto = (msg.content[:50] + '...') if len(msg.content) > 50 else msg.content
        print(f"   -> [{i}] Rol detectado: '{msg.role}' | Texto: {resumen_texto}", flush=True)

        if msg.role == "user":
            # Si es el usuario, lo metemos en el objeto de LangChain correspondiente
            lc.append(HumanMessage(content=msg.content))
            print(f"      ✅ Mapeado a -> HumanMessage", flush=True)
        else:
            # Si es el bot (assistant/system), va a AIMessage
            lc.append(AIMessage(content=msg.content))
            print(f"      ✅ Mapeado a -> AIMessage", flush=True)

    print(f"🔍 [DEBUG Historial] Lista 'lc' finalizada con {len(lc)} objetos.\n", flush=True)
    return lc


async def _stream_and_collect(llm: ChatOpenAI, messages: list, label: str) -> str:
    """
    Stream tokens from the LLM, log each chunk at DEBUG level,
    and return the full assembled reply.
    🟢 = success token  ⚙ = debug token chunk
    """
    full_reply = ""
    logger.info("[%s] ▶ Starting LLM stream (model=%s)", label, llm.model_name)
    async for chunk in llm.astream(messages):
        token = chunk.content
        if token:
            # logger.debug("[%s][token] %s", label, token)
            full_reply += token
    char_count = len(full_reply)
    logger.info("[%s] ✓ Stream complete — %d chars generated", label, char_count)
    return full_reply




# ──────────────────────────────────────────────────────────────────────────────
# Graph factory
# ──────────────────────────────────────────────────────────────────────────────

def build_graph(db: AsyncSession) -> StateGraph:
    """
    Build and compile the LangGraph StateGraph.
    The `db` session is captured in node closures so nodes can run RAG queries.
    """

    # ── LLM clients (read models from ai_config, never hardcoded) ────────────
    triage_llm = ChatOpenAI(
        model=ai_config.TRIAGE_MODEL,
        temperature=ai_config.TRIAGE_TEMPERATURE,
        api_key=os.getenv("OPENAI_API_KEY"),
    )
    recipe_llm = ChatOpenAI(
        model=ai_config.RECIPE_MODEL,
        temperature=ai_config.RECIPE_TEMPERATURE,
        api_key=os.getenv("OPENAI_API_KEY"),
    )
    purchase_llm = ChatOpenAI(
        model=ai_config.PURCHASE_MODEL,
        temperature=ai_config.PURCHASE_TEMPERATURE,
        api_key=os.getenv("OPENAI_API_KEY"),
    )
    info_llm = ChatOpenAI(
        model=ai_config.INFO_MODEL,
        temperature=ai_config.INFO_TEMPERATURE,
        api_key=os.getenv("OPENAI_API_KEY"),
    )

    # ── NODE: triage ──────────────────────────────────────────────────────────
    async def triage_node(state: GraphState) -> dict:
        user_query = state["messages"][-1].content
        logger.info("[Triage] ── New request ─────────────────────────────")
        logger.info("[Triage] 📥 User query: '%s'", user_query)
        logger.info("[Triage] 📤 Sending to model: %s", ai_config.TRIAGE_MODEL)

        prompt = (
            "Eres un clasificador de intenciones para la pastelería Zenda.\n\n"
            "Categorías:\n"
            "- recipe: recetas o ingredientes\n"
            "- purchase: intención de compra\n"
            "- info: preguntas informativas\n"
            "- greeting: saludos o conversación casual\n\n"
            "Ejemplos:\n"
            "hola → greeting\n"
            "gracias → greeting\n"
            "quiero comprar un mousse → purchase\n"
            "qué tiene la panna cotta → info\n\n"
            "Responde SOLO con JSON: {\"intent\": \"<categoria>\"}\n\n"
            f"Mensaje: {user_query}"
        )

        response = await triage_llm.ainvoke([HumanMessage(content=prompt)])
        logger.debug("[Triage] 📨 Raw model response: %s", response.content)

        try:
            data = json.loads(response.content)
            intent = data.get("intent", "info")
        except (json.JSONDecodeError, AttributeError):
            logger.warning("[Triage] Failed to parse JSON intent, defaulting to 'info'")
            intent = "info"

        if intent not in ("recipe", "purchase", "info", "greeting"):
            logger.warning("[Triage] Unknown intent '%s', defaulting to 'info'", intent)
            intent = "info"

        logger.info("[Triage] ✓ Intent classified → '%s'", intent)
        return {"intent": intent}

    # ── NODE: recipe ──────────────────────────────────────────────────────────
    async def recipe_node(state: GraphState) -> dict:
        user_query = state["messages"][-1].content
        logger.info("[Recipe] ▶ RAG retrieval started for: '%s'", user_query)
        context, _ = await retrieve_products(user_query, db)
        logger.info("[Recipe] ✓ Context retrieved (%d chars)", len(context))
        logger.debug("[Recipe] Context:\n%s", context)

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
        logger.debug("[Recipe] System prompt (first 200 chars): %s...", system[:200])

        messages = [SystemMessage(content=system)] + _build_lc_history(state)
        logger.info("[Recipe] 📤 Sending %d messages to %s", len(messages), ai_config.RECIPE_MODEL)
        reply = await _stream_and_collect(recipe_llm, messages, label="recipe")
        logger.info("[Recipe] ✅ Reply ready (%d chars)", len(reply))
        return {"reply": reply, "actions": [], "context": context}

    # ── NODE: purchase ────────────────────────────────────────────────────────
    async def purchase_node(state: GraphState) -> dict:
        user_query = state["messages"][-1].content
        logger.info("[Purchase] ▶ RAG retrieval for cart request: '%s'", user_query)
        context, products = await retrieve_products(user_query, db)
        logger.info("[Purchase] ✓ %d products retrieved from pgvector", len(products))

        # Step 1: Extract product names via LLM
        extraction_prompt = (
            "El usuario quiere agregar productos al carrito. "
            "Dado este mensaje del usuario y el catálogo disponible, "
            "responde ÚNICAMENTE con un JSON: {\"products_to_add\": [\"nombre1\", \"nombre2\"]}\n\n"
            f"Mensaje del usuario: {user_query}\n\n"
            f"Catálogo disponible:\n{context}"
        )
        logger.info("[Purchase] 📤 Sending extraction prompt to %s", ai_config.PURCHASE_MODEL)
        extraction_resp = await purchase_llm.ainvoke([HumanMessage(content=extraction_prompt)])
        logger.debug("[Purchase] 📨 Extraction response: %s", extraction_resp.content)

        try:
            extracted = json.loads(extraction_resp.content)
            names_to_add: List[str] = extracted.get("products_to_add", [])
            logger.info("[Purchase] 🛒 Products identified: %s", names_to_add)
        except (json.JSONDecodeError, AttributeError):
            logger.warning("[Purchase] Failed to parse product names JSON from LLM")
            names_to_add = []

        # Step 2: Resolve names → CartActions
        actions = await resolve_product_ids(names_to_add, products)
        if actions:
            logger.info("[Purchase] ✅ %d cart actions resolved: %s",
                        len(actions), [a.product_name for a in actions])
        else:
            logger.warning("[Purchase] No products could be matched to DB IDs")

        # Step 3: Confirmation reply
        if actions:
            product_list = ", ".join(f"**{a.product_name}**" for a in actions)
            confirm_system = (
                "Eres el asistente de Zenda. Confirma al cliente de manera amigable y entusiasta "
                "que los siguientes productos han sido agregados a su carrito:\n\n"
                f"{product_list}"
            )
        else:
            confirm_system = (
                "Eres el asistente de Zenda. Dile al cliente de manera amable que no pudiste "
                "encontrar exactamente ese producto en nuestro catálogo, o pregúntale si "
                "quiso decir otro nombre similar.\n\n"
                f"Mensaje original del usuario: {user_query}\n"
                f"Catálogo recuperado: {context}"
            )

        messages = [SystemMessage(content=confirm_system)] + _build_lc_history(state)
        reply = await _stream_and_collect(purchase_llm, messages, label="purchase")
        logger.info("[Purchase] ✅ Confirmation reply sent")
        return {"reply": reply, "actions": actions, "context": context}

    # ── NODE: info ────────────────────────────────────────────────────────────
    async def info_node(state: GraphState) -> dict:
        user_query = state["messages"][-1].content
        logger.info("[Info] ▶ RAG retrieval for nutritional query: '%s'", user_query)
        context, _ = await retrieve_products(user_query, db)
        logger.info("[Info] ✓ Context retrieved (%d chars)", len(context))

        system = (
            "Eres el experto en nutrición y bienestar de la pastelería Zenda. "
            "Responde preguntas sobre información nutricional y beneficios de los ingredientes. "
            "Usa el catálogo como referencia cuando sea relevante, y complementa con conocimiento "
            "nutricional general cuando sea apropiado. Habla en español, de forma clara y accesible.\n\n"
            f"CATÁLOGO DE REFERENCIA:\n{context}"
        )

        messages = [SystemMessage(content=system)] + _build_lc_history(state)
        logger.info("[Info] 📤 Sending %d messages to %s", len(messages), ai_config.INFO_MODEL)
        reply = await _stream_and_collect(info_llm, messages, label="info")
        logger.info("[Info] ✅ Info reply ready (%d chars)", len(reply))
        return {"reply": reply, "actions": [], "context": context}

    # ── NODE: greeting  ────────────────────────────────────────────────────────────
    async def greeting_node(state: GraphState) -> dict:
        user_query = state["messages"][-1].content
        logger.info("[Greeting] ▶ Processing greeting: '%s'", user_query)

        system = (
        "Eres el asistente de la pastelería saludable Zenda.\n\n"
        "REGLAS:\n"
        "1. Si el usuario saluda (ej: 'hola', 'buenas'), SIEMPRE responde con un saludo.\n"
        "2. Preséntate brevemente solo si es el inicio de la conversación.\n"
        "3. No respondas como si la conversación estuviera terminando.\n"
        "4. No digas frases como '¿algo más?' o '¿en qué más puedo ayudarte?'.\n"
        "5. Después del saludo, sugiere de forma natural qué puede hacer el usuario.\n\n"
        "Ejemplo de respuesta correcta:\n"
        "¡Hola! 👋 Soy tu asistente de Zenda. Puedo ayudarte a descubrir postres saludables o darte información nutricional. ¿Qué te gustaría ver?\n\n"
        "Responde siempre en español, con tono cálido y natural."
    )

        messages = [SystemMessage(content=system)] + _build_lc_history(state)
        logger.info("[Greeting] 📤 Sending %d messages to %s", len(messages), ai_config.INFO_MODEL)
        reply = await _stream_and_collect(info_llm, messages, label="greeting")
        logger.info("[Greeting] ✅ Greeting reply ready (%d chars)", len(reply))
        return {"reply": reply, "actions": [], "context": ""}

    # ── Conditional edge (router) ─────────────────────────────────────────────
    def route_by_intent(state: GraphState) -> str:
        intent = state.get("intent", "info")
        logger.debug("[Router] Routing to node: %s", intent)
        return intent  # Must match node names registered below

    # ── Assemble graph ────────────────────────────────────────────────────────
    graph = StateGraph(GraphState)

    graph.add_node("triage", triage_node)
    graph.add_node("recipe", recipe_node)
    graph.add_node("purchase", purchase_node)   
    graph.add_node("info", info_node)
    graph.add_node("greeting", greeting_node)

    graph.add_edge(START, "triage")
    graph.add_conditional_edges(
        "triage",
        route_by_intent,
        {
            "recipe": "recipe",
            "purchase": "purchase",
            "info": "info",
            "greeting": "greeting",
        },
    )
    graph.add_edge("recipe", END)
    graph.add_edge("purchase", END)
    graph.add_edge("info", END)
    graph.add_edge("greeting", END)

    return graph.compile()
