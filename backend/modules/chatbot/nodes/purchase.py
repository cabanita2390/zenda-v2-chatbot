"""
nodes/purchase.py
-----------------
Agente especializado en compras y gestión del carrito.
Contiene la lógica más compleja del sistema: confirmaciones, negativas,
extracción de cantidades, reranking y decisión de seguridad.
"""
from __future__ import annotations

import json
import logging

from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from ..chatbot_state import GraphState
from ..chatbot_tools import retrieve_products, resolve_product_ids
from ..utils import (
    build_lc_history,
    stream_and_collect,
    get_search_query,
    rerank_products,
    clean_json_response,
)

logger = logging.getLogger(__name__)


def create_purchase_node(llm: ChatOpenAI, db: AsyncSession):
    """Factory: retorna el nodo de compras con LLM y DB inyectados."""

    async def purchase_node(state: GraphState) -> dict:
        user_query = state["messages"][-1].content
        history = build_lc_history(state)

        # 1. ¿ES UNA CONFIRMACIÓN? (Si el usuario dice "Sí")
        is_confirmation = False
        if len(user_query.split()) <= 2:
            prompt_conf = f"¿El usuario está diciendo que SÍ o confirmando una acción previa? Responde SOLO 'YES' o 'NO'. Mensaje: '{user_query}'"
            resp_conf = await llm.ainvoke([HumanMessage(content=prompt_conf)])
            is_confirmation = "YES" in resp_conf.content.upper()

        # 2. QUERY REWRITING
        search_query = await get_search_query(state, llm)

        # 3. BÚSQUEDA RAG Y RERANKING
        logger.info("[Purchase] ▶ RAG retrieval for: '%s'", search_query)
        context, raw_products = await retrieve_products(search_query, db)
        products = await rerank_products(search_query, raw_products, llm)

        # 3b. ¿ES UNA NEGATIVA? (Si el usuario dice "No", "No gracias")
        is_negative = False
        if len(user_query.split()) <= 6:
            prompt_neg = f"¿El usuario está RECHAZANDO, diciendo que NO o pidiendo que no se haga nada? Responde SOLO 'YES' o 'NO'. Mensaje: '{user_query}'"
            resp_neg = await llm.ainvoke([HumanMessage(content=prompt_neg)])
            is_negative = "YES" in resp_neg.content.upper()

        # Si es negativa pura ("No", sin alternativas) y no generó una búsqueda exitosa:
        if is_negative and not products:
            reply = "¡Entendido! No lo agregaré. ¿Hay algún otro postre que te gustaría explorar o alguna otra duda que tengas? 😊"
            return {"reply": reply, "actions": [], "context": ""}

        # 4. EXTRACCIÓN DE ÓRDENES
        orders_to_add = []
        if products:
            extraction_prompt = (
                "Eres un extractor de órdenes preciso para Zenda.\n"
                "Tu tarea es extraer la cantidad que el usuario desea del producto validado.\n\n"
                "REGLAS CRÍTICAS:\n"
                f"1. Si el mensaje del usuario ('{user_query}') contiene un número (ej: 'Dame 3'), esa ES la cantidad.\n"
                "2. NUNCA, bajo ninguna circunstancia, uses los números entre corchetes [ID] como cantidades.\n"
                "3. Si el usuario no especifica cantidad (ej: dice 'Sí' o 'Agrégalo'), la cantidad por defecto es 1.\n"
                "4. Responde ÚNICAMENTE con el formato JSON: {\"orders\": [{\"name\": \"...\", \"quantity\": 1}]}\n\n"
                f"MENSAJE DEL USUARIO: {user_query}\n"
                f"PRODUCTO VALIDADO:\n{context}"
            )
            extraction_resp = await llm.ainvoke([HumanMessage(content=extraction_prompt)])
            try:
                clean_json = clean_json_response(extraction_resp.content)
                extracted = json.loads(clean_json)
                orders_to_add = extracted.get("orders", [])
            except Exception:
                orders_to_add = []

        # 5. LÓGICA DE DECISIÓN (EL "CEREBRO" DE SEGURIDAD)
        action_verbs = ["añade", "pon", "agrega", "compra", "suma", "quiero 2", "quiero 3", "dame", "regalame", "ponme", "mandame"]
        is_explicit = any(v in user_query.lower() for v in action_verbs)

        # Verificamos si el producto fue mencionado por el ASISTENTE en el turno anterior.
        last_assistant_msg = ""
        for m in reversed(state["messages"][:-1]):
            if m.role == "assistant":
                last_assistant_msg = m.content
                break

        was_in_context = any(p.name.lower() in last_assistant_msg.lower() for p in products)

        # ¿El bot YA mostró las opciones al usuario en el turno anterior?
        last_was_disambiguation = "¿Cuál te gustaría agregar al carrito?" in last_assistant_msg

        actions = []
        should_ask_permission = False
        should_disambiguate = False

        if products:
            if len(products) > 1:
                if last_was_disambiguation:
                    # El usuario YA vio las opciones y está respondiendo → agregar
                    actions = await resolve_product_ids(orders_to_add, products)
                else:
                    # Primera vez que ve múltiples productos → mostrar opciones
                    should_disambiguate = True
            elif is_confirmation or is_explicit:
                actions = await resolve_product_ids(orders_to_add, products)
            else:
                should_ask_permission = True

        # 6. GENERAR RESPUESTA
        if should_disambiguate:
            options = "\n".join([f"- **{p.name}** — ${p.price:,.0f}".replace(",", ".") for p in products])
            reply = (
                f"Tenemos varias opciones de lo que buscas:\n\n{options}\n\n"
                "¿Cuál te gustaría agregar al carrito? 😊"
            )
        elif should_ask_permission:
            product_name = products[0].name
            reply = f"Veo que te interesa el **{product_name}**. ¿Te gustaría que lo agregue a tu carrito?"
        elif actions:
            # Confirmación via LLM con restricciones estrictas
            items_str = ", ".join([f"{a.quantity}x {a.product_name}" for a in actions])
            confirm_system = (
                "Eres el asistente de la pastelería saludable Zenda. "
                "Confirma de forma cálida y breve que agregaste los siguientes productos al pedido del usuario.\n\n"
                f"PRODUCTOS AGREGADOS (EXACTOS, úsalos tal cual): {items_str}\n\n"
                "REGLAS:\n"
                "1. Menciona ÚNICAMENTE los productos de la lista anterior. NO inventes ni menciones otros.\n"
                "2. No repitas productos que el usuario ya tenía en el carrito de turnos anteriores.\n"
                "3. Sé breve, cálido y pregunta si desea algo más."
            )
            messages = [SystemMessage(content=confirm_system)] + history
            reply = await stream_and_collect(llm, messages, label="purchase")
        else:
            system_fallback = "Eres el asistente de Zenda. Indica que no encontraste ese producto exacto o pregunta para aclarar."
            messages = [SystemMessage(content=system_fallback)] + history
            reply = await stream_and_collect(llm, messages, label="purchase")

        return {"reply": reply, "actions": actions, "context": context}

    return purchase_node
