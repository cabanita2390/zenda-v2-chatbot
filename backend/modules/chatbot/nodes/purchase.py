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
import re
import unicodedata

from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from ..chatbot_state import GraphState
from ..chatbot_tools import (
    retrieve_products,
    resolve_product_ids,
    get_all_products,
    resolve_multi_item_order,
)
from ..utils import (
    build_lc_history,
    stream_and_collect,
    get_search_query,
    rerank_products,
    clean_json_response,
    extract_order_items,
    SCOPE_RULES,
)
from ..chatbot_tools import DISAMBIGUATION_QUESTION, find_matching_products

logger = logging.getLogger(__name__)


def _normalize(text: str) -> str:
    plain = unicodedata.normalize("NFD", text.lower())
    return "".join(c for c in plain if unicodedata.category(c) != "Mn")


# Raíces de verbos de compra: "guárdame", "resérvame", "apártame", "me llevo", "agrégame"...
_ORDER_VERB_RE = re.compile(
    r"\b(agreg|anad|pon|dam|quier|compr|sum|regal|mand|guard|reserv|apart|llev|encarg|pid|ech|separ)"
)
# Cantidades explícitas: "2", "dos", "media docena", "uno de", "una de".
_QUANTITY_RE = re.compile(
    r"\b(\d+|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|docena|(?:uno|una|un) de)\b"
)


# "no quiero...", "no me agregues...": rechazo explícito aunque mencione cantidad.
_NEGATED_ORDER_RE = re.compile(r"\bno\s+(?:me\s+|lo\s+|la\s+)?(?:quier|agreg|pon|guard|dam|anad|compr|sum|llev)")


# "mejor...", "prefiero...", "en vez de...": el cliente cambia de producto, no rechaza todo.
_PREFERENCE_RE = re.compile(r"\b(mejor|prefier|en vez|en lugar|cambia)")


def _has_order_verb(text: str) -> bool:
    n = _normalize(text)
    return bool(_ORDER_VERB_RE.search(n) or re.search(r"\bprefier", n))


def _has_quantity(text: str) -> bool:
    return bool(_QUANTITY_RE.search(_normalize(text)))


def create_purchase_node(llm: ChatOpenAI, db: AsyncSession):
    """Factory: retorna el nodo de compras con LLM y DB inyectados."""

    async def confirm_added(actions: list, history: list) -> str:
        """Confirmación via LLM con restricciones estrictas."""
        items_str = ", ".join([f"{a.quantity}x {a.product_name}" for a in actions])
        confirm_system = (
            "Eres el asistente de la pastelería saludable Zenda. "
            "Confirma de forma cálida y breve que agregaste los siguientes productos al pedido del usuario.\n\n"
            f"PRODUCTOS AGREGADOS (EXACTOS, úsalos tal cual): {items_str}\n\n"
            "REGLAS:\n"
            "1. Menciona ÚNICAMENTE los productos de la lista anterior. NO inventes ni menciones otros.\n"
            "2. No repitas productos que el usuario ya tenía en el carrito de turnos anteriores.\n"
            "3. Sé breve, cálido y pregunta si desea algo más.\n\n"
            f"{SCOPE_RULES}"
        )
        messages = [SystemMessage(content=confirm_system)] + history
        return await stream_and_collect(llm, messages, label="purchase")

    async def purchase_node(state: GraphState) -> dict:
        user_query = state["messages"][-1].content
        history = build_lc_history(state)

        # 1. ¿ES UNA CONFIRMACIÓN? (Si el usuario dice "Sí")
        is_confirmation = False
        if len(user_query.split()) <= 2:
            prompt_conf = f"¿El usuario está diciendo que SÍ o confirmando una acción previa? Responde SOLO 'YES' o 'NO'. Mensaje: '{user_query}'"
            resp_conf = await llm.ainvoke([HumanMessage(content=prompt_conf)])
            is_confirmation = "YES" in resp_conf.content.upper()

        # 1b. "Sí" A UNA OFERTA: el mensaje no nombra el producto, así que se toma
        # del último turno del bot (salvo que ese turno ya lo haya agregado).
        if is_confirmation:
            last_bot_msg = next(
                (m.content.lower() for m in reversed(state["messages"][:-1]) if m.role == "assistant"), ""
            )
            if "agregado" not in last_bot_msg:
                catalog = await get_all_products(db)
                offered = [p for p in catalog if p.name.lower() in last_bot_msg]
                if len(offered) == 1:
                    actions = await resolve_product_ids([{"name": offered[0].name, "quantity": 1}], offered)
                    reply = await confirm_added(actions, history)
                    return {"reply": reply, "actions": actions, "context": ""}

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

        # Si es negativa pura ("No", "No gracias") y no hay una clara intención de buscar otro postre:
        if is_negative:
            # Si el mensaje es muy corto (negativa pura), detenemos la venta aquí.
            if len(user_query.split()) <= 3:
                reply = "¡Entendido! No lo agregaré. ¿Deseas explorar algún otro postre de nuestro menú o tienes alguna otra duda? 😊"
                return {"reply": reply, "actions": [], "context": ""}
            
            # Si el usuario dice "No" pero menciona algo más, seguimos adelante solo si el buscador encuentra algo nuevo

        # Último turno del bot (se usa para detectar desambiguaciones y ofertas).
        last_assistant_msg = next(
            (m.content for m in reversed(state["messages"][:-1]) if m.role == "assistant"), ""
        )
        last_was_disambiguation = DISAMBIGUATION_QUESTION in last_assistant_msg

        # 3c. PEDIDO DIRECTO: cada ítem se resuelve contra el catálogo COMPLETO
        # (la búsqueda RAG solo trae 3 productos). Aplica cuando el cliente pide
        # varios productos, usa un verbo de compra, da una cantidad ("y dos de
        # uchuva") o está eligiendo entre las opciones que le mostramos.
        # Una negativa con cantidad ("no, mejor dos de matcha") es un cambio de
        # pedido; pero "no quiero dos de uchuva" sigue siendo un rechazo.
        is_correction = (
            is_negative
            and (_has_quantity(user_query) or _PREFERENCE_RE.search(_normalize(user_query)))
            and not _NEGATED_ORDER_RE.search(_normalize(user_query))
        )
        if not is_negative or is_correction:
            items = await extract_order_items(user_query, llm)
            is_direct_order = (
                len(items) > 1
                or _has_order_verb(user_query)
                or _has_quantity(user_query)
                or last_was_disambiguation
            )
            # "algo de chocolate" es una búsqueda vaga: se ofrece, no se agrega.
            is_vague = bool(re.search(r"\balg(?:o|un|una|uno)\b", _normalize(user_query)))
            if items and is_direct_order and not is_vague:
                logger.info("[Purchase] Direct order: %d items extracted.", len(items))
                catalog = await get_all_products(db)
                actions, notices = resolve_multi_item_order(items, catalog)
                reply = await confirm_added(actions, history) if actions else ""
                reply = "\n\n".join(part for part in [reply, *notices] if part)
                if not reply:
                    reply = "No agregué nada a tu carrito. ¿Qué postre y cuántas unidades te gustaría? 😊"
                return {"reply": reply, "actions": actions, "context": context}

        if is_negative and not is_correction:
            # Rechazo ("no quiero el de uchuva"): no se agrega ni se ofrece ese producto.
            reply = "¡Entendido! No lo agregaré. ¿Deseas explorar algún otro postre de nuestro menú o tienes alguna otra duda? 😊"
            return {"reply": reply, "actions": [], "context": ""}

        # 4. EXTRACCIÓN DE ÓRDENES
        orders_to_add = []
        if products:
            extraction_prompt = (
                "Eres un extractor de órdenes preciso para Zenda.\n"
                "Tu tarea es extraer TODOS los productos y cantidades que el usuario desea agregar en este mensaje.\n\n"
                "REGLAS CRÍTICAS:\n"
                f"1. Si el mensaje del usuario ('{user_query}') contiene un número (ej: 'Dame 3'), esa ES la cantidad de ese producto.\n"
                "2. NUNCA uses los números entre corchetes [ID] como cantidades.\n"
                "3. Si el usuario no especifica cantidad para un producto, la cantidad por defecto es 1.\n"
                "4. Si el usuario menciona VARIOS productos distintos, extráelos TODOS en la lista.\n"
                "5. Responde ÚNICAMENTE con JSON: {\"orders\": [{\"name\": \"...\", \"quantity\": 1}, ...]}\n\n"
                f"MENSAJE DEL USUARIO: {user_query}\n"
                f"CATÁLOGO DISPONIBLE:\n{context}"
            )
            extraction_resp = await llm.ainvoke([HumanMessage(content=extraction_prompt)])
            try:
                clean_json = clean_json_response(extraction_resp.content)
                extracted = json.loads(clean_json)
                orders_to_add = extracted.get("orders", [])
            except Exception:
                orders_to_add = []

        # 5. LÓGICA DE DECISIÓN (EL "CEREBRO" DE SEGURIDAD)
        # "no quiero el de uchuva" contiene "quiero" pero es un rechazo.
        is_explicit = _has_order_verb(user_query) and not is_negative

        actions = []
        should_ask_permission = False
        should_disambiguate = False

        # Resolvemos IDs de forma anticipada para poder tomar decisiones
        actions_resolved = await resolve_product_ids(orders_to_add, products)

        if products:
            if len(products) > 1:
                if last_was_disambiguation:
                    # El usuario YA vio las opciones y está respondiendo → agregar
                    actions = actions_resolved
                else:
                    # Primera vez que ve múltiples productos → mostrar opciones
                    should_disambiguate = True
            elif is_confirmation or is_explicit:
                actions = actions_resolved
            else:
                should_ask_permission = True

        # 6. GENERAR RESPUESTA
        if should_disambiguate:
            # La búsqueda RAG trae máximo 3; si el término genérico ("cheesecake")
            # coincide con más productos del catálogo, se muestran todos.
            full_matches = find_matching_products(search_query, await get_all_products(db))
            if len(full_matches) > len(products):
                products = full_matches
            options = "\n".join([f"- **{p.name}** — ${p.price:,.0f}".replace(",", ".") for p in products])
            reply = (
                f"Tenemos varias opciones de lo que buscas:\n\n{options}\n\n"
                f"{DISAMBIGUATION_QUESTION} 😊"
            )
        elif should_ask_permission:
            product_name = products[0].name
            reply = f"Veo que te interesa el **{product_name}**. ¿Te gustaría que lo agregue a tu carrito?"
        elif actions:
            reply = await confirm_added(actions, history)
        else:
            system_fallback = (
                "Eres el asistente de Zenda. Indica que no encontraste ese producto exacto o pregunta para aclarar.\n\n"
                f"{SCOPE_RULES}"
            )
            messages = [SystemMessage(content=system_fallback)] + history
            reply = await stream_and_collect(llm, messages, label="purchase")

        return {"reply": reply, "actions": actions, "context": context}

    return purchase_node
