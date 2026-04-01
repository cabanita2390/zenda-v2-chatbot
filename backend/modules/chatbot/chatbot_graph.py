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


async def _get_search_query(state: GraphState, llm: ChatOpenAI) -> str:
    """
    Query Rewriting: Transforma el historial en una consulta de búsqueda única.
    Maneja referencias como 'esta', 'la segunda', 'la opcion 1'.
    """
    history = _build_lc_history(state)
    last_user_msg = state["messages"][-1].content

    prompt = (
        "Eres un REESCRITOR de consultas de búsqueda para la pastelería Zenda.\n"
        "Tu única tarea es extraer el tema o producto de interés del usuario para buscarlo en una base de datos vectorial.\n\n"
        "REGLAS:\n"
        "1. NO intentes responder al usuario.\n"
        "2. NO inventes productos que no estén en el historial.\n"
        "3. Si el usuario pregunta por 'postres' en general, devuelve simplemente 'postres'.\n"
        "4. Si el usuario se refiere a una opción numerada de la lista anterior (ej: 'la 2'), devuelve el NOMBRE del producto que ocupaba esa posición.\n\n"
        "REGLA DE ORO: NO hables, NO añadas palabras como 'mousse' o 'tarta' si el usuario no las dijo.\n"
        "Responde ÚNICAMENTE con los términos de búsqueda (máximo 3 palabras)."
    )

    response = await llm.ainvoke([SystemMessage(content=prompt)] + history)
    query = response.content.strip().replace('"', '').replace('.', '')
    logger.info("[Query Rewrite] '%s' -> '%s'", last_user_msg, query)
    return query


def _clean_json_response(text: str) -> str:
    """Elimina bloques de código markdown y espacios extra de una respuesta JSON."""
    text = text.strip()
    if text.startswith("```"):
        # Extraer contenido entre ```json y ``` o simplemente ```
        import re
        match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL)
        if match:
            return match.group(1)
    return text


async def _rerank_products(query: str, products: List, llm: ChatOpenAI) -> List:
    """
    Reranker (Juez): El LLM valida si alguno de los productos recuperados de 
    la base de datos vectorial coincide de verdad con la intención del usuario.
    Usa IDs para evitar problemas de nombres parecidos.
    """
    if not products:
        return []

    # Creamos un catálogo rápido con IDs
    catalog_str = "\n".join([f"- {p.name} (ID: {p.id})" for p in products])
    
    prompt = (
        f"El usuario busca: '{query}'\n\n"
        f"Candidatos encontrados en la DB:\n{catalog_str}\n\n"
        "REGLAS CRÍTICAS:\n"
        "1. Solo valida productos que coincidan EXACTAMENTE con el sabor o tipo solicitado.\n"
        "2. Si pide 'maracuyá', NO aceptes 'uchuva' aunque sean frutas similares.\n"
        "3. Si el usuario pide un producto en singular ('el de...'), intenta devolver solo el ID más relevante.\n"
        "4. Responde ÚNICAMENTE con los IDs de los productos separados por comas. Si no hay coincidencia exacta, responde 'NONE'.\n"
        "Respuesta (solo IDs o NONE):"
    )
    
    response = await llm.ainvoke([SystemMessage(content=prompt)])
    decision = response.content.strip().upper()
    
    if "NONE" in decision:
        logger.warning("[Reranker] ❌ Ningún producto fue validado por el juez.")
        return []
    
    # Extraemos los números de la respuesta (los IDs)
    import re
    validated_ids = [int(n) for n in re.findall(r'\d+', decision)]
    
    # Filtramos la lista original por los IDs validados
    validated = [p for p in products if p.id in validated_ids]
    logger.info("[Reranker] ✅ Juez validó IDs: %s", [p.id for p in validated])
    return validated



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
            "- purchase: El usuario quiere comprar, añadir al carrito, confirma una compra ('Sí', 'Dale') o da una cantidad ('2', 'tres').\n"
            "- info: Preguntas informativas sobre qué es un producto o qué postres hay.\n"
            "- greeting: Saludos, despedidas o charla casual.\n\n"
            "HISTORIAL RECIENTE (Para contexto):\n"
            f"{context_str}\n"
            "REGLA DE ORO: Si el Bot hizo una pregunta de compra anteriormente, las respuestas cortas del Usuario "
            "como 'Sí', 'No' o números deben clasificarse como 'purchase'.\n\n"
            "Responde SOLO con JSON: {\"intent\": \"<categoria>\"}\n\n"
            f"Mensaje actual del Usuario: {user_query}"
        )

        response = await triage_llm.ainvoke([HumanMessage(content=prompt)])
        logger.debug("[Triage] 📨 Raw model response: %s", response.content)

        try:
            # Limpiamos el JSON por si el modelo envía markdown
            clean_json = _clean_json_response(response.content)
            data = json.loads(clean_json)
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
        search_query = await _get_search_query(state, recipe_llm)
        logger.info("[Recipe] ▶ RAG retrieval started for: '%s'", search_query)
        context, _ = await retrieve_products(search_query, db)
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
    
    
    # ── NODE: purchase ────────────────────────────────────────────────────────
    async def purchase_node(state: GraphState) -> dict:
        user_query = state["messages"][-1].content
        history = _build_lc_history(state)
        
        # 1. ¿ES UNA CONFIRMACIÓN? (Si el usuario dice "Sí")
        # Si el usuario solo dice "Sí", "Dále", etc., buscamos qué le ofrecimos antes.
        is_confirmation = False
        if len(user_query.split()) <= 2:
            prompt_conf = f"¿El usuario está diciendo que SÍ o confirmando una acción previa? Responde SOLO 'YES' o 'NO'. Mensaje: '{user_query}'"
            resp_conf = await purchase_llm.ainvoke([HumanMessage(content=prompt_conf)])
            is_confirmation = "YES" in resp_conf.content.upper()

        # 2. QUERY REWRITING
        # Si es confirmación, el reescritor usará el historial para saber qué producto era.
        search_query = await _get_search_query(state, purchase_llm)
        
        # 3. BÚSQUEDA RAG Y RERANKING
        logger.info("[Purchase] ▶ RAG retrieval for: '%s'", search_query)
        context, raw_products = await retrieve_products(search_query, db)
        products = await _rerank_products(search_query, raw_products, purchase_llm)
        
        # 4. EXTRACCIÓN DE ÓRDENES
        orders_to_add = []
        if products:
            extraction_prompt = (
                "Dado este mensaje y los productos validados, extrae las cantidades.\n"
                "Responde ÚNICAMENTE con un JSON: {\"orders\": [{\"name\": \"...\", \"quantity\": 1}]}\n"
                f"Mensaje original: {user_query}\n" # <--- ¡Aquí usamos el original!
                f"Productos Validados:\n{context}"
            )
            extraction_resp = await purchase_llm.ainvoke([HumanMessage(content=extraction_prompt)])
            try:
                clean_json = _clean_json_response(extraction_resp.content)
                extracted = json.loads(clean_json)
                orders_to_add = extracted.get("orders", [])
            except:
                orders_to_add = []

        # 5. LÓGICA DE DECISIÓN (EL "CEREBRO" DE SEGURIDAD)
        # Analizamos si debemos añadir al carrito YA o PREGUNTAR primero.
        # Definimos 'explicit_command' si el usuario usó verbos de acción.
        action_verbs = ["añade", "pon", "agrega", "compra", "suma", "quiero 2", "quiero 3"]
        is_explicit = any(v in user_query.lower() for v in action_verbs)
        
        # Verificamos si el producto fue mencionado por el ASISTENTE en el turno anterior.
        last_assistant_msg = ""
        for m in reversed(state["messages"][:-1]):
            if m.role == "assistant":
                last_assistant_msg = m.content
                break
        
        was_in_context = any(p.name.lower() in last_assistant_msg.lower() for p in products)

        actions = []
        should_ask_permission = False

        if products:
            # Si es confirmación ("Sí") o una orden directa, procedemos.
            if is_confirmation or is_explicit:
                actions = await resolve_product_ids(orders_to_add, products)
            else:
                # Si es nuevo contexto (no se habló antes) o es ambiguo, preguntamos.
                should_ask_permission = True

        # 6. GENERAR RESPUESTA
        if should_ask_permission:
            product_name = products[0].name
            reply = f"Veo que te interesa el **{product_name}**. ¿Te gustaría que lo agregue a tu carrito?"
            # En este caso, NO enviamos acciones al frontend todavía.
        elif actions:
            product_list = ", ".join([f"**{a.product_name}**" for a in actions])
            confirm_system = f"Eres el asistente de Zenda. Confirma alegremente que agregaste: {product_list}"
            messages = [SystemMessage(content=confirm_system)] + history
            reply = await _stream_and_collect(purchase_llm, messages, label="purchase")
        else:
            system_fallback = "Eres el asistente de Zenda. Indica que no encontraste ese producto exacto o pregunta para aclarar."
            messages = [SystemMessage(content=system_fallback)] + history
            reply = await _stream_and_collect(purchase_llm, messages, label="purchase")

        return {"reply": reply, "actions": actions, "context": context}




    # ── NODE: info ────────────────────────────────────────────────────────────
    async def info_node(state: GraphState) -> dict:
        search_query = await _get_search_query(state, info_llm)
        logger.info("[Info] ▶ RAG retrieval for nutritional query: '%s'", search_query)
        context, _ = await retrieve_products(search_query, db)

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
