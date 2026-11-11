"""
chatbot_tools.py
----------------
Async helper functions used by graph nodes.

All DB-dependent functions receive a `db: AsyncSession` argument
(injected via the graph factory closure, not via LangChain tool decorators)
to keep them compatible with SQLAlchemy's async context.
"""
from __future__ import annotations

import logging
import os
import re
import unicodedata
from difflib import SequenceMatcher
from typing import List

from langchain_openai import OpenAIEmbeddings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.ai_config import EMBEDDING_MODEL, RAG_TOP_K
from modules.products.products_model import Product
from modules.orders.orders_model import Order
from .chatbot_schema import CartAction

logger = logging.getLogger(__name__)

# Lazy singleton — created on first use, not at import time.
# This ensures os.getenv reads the value AFTER load_dotenv() runs in main.py.
_embeddings_client: OpenAIEmbeddings | None = None


def _get_embeddings() -> OpenAIEmbeddings:
    global _embeddings_client
    if _embeddings_client is None:
        _embeddings_client = OpenAIEmbeddings(
            model=EMBEDDING_MODEL,
            api_key=os.getenv("OPENAI_API_KEY"),
        )
    return _embeddings_client



async def retrieve_products(query: str, db: AsyncSession) -> tuple[str, List[Product]]:
    """
    Semantic search via pgvector (cosine distance).
    Returns a (formatted_context_str, raw_products_list) tuple.
    """
    logger.debug("[RAG] Embedding query: %s", query)
    query_vector = await _get_embeddings().aembed_query(query)

    stmt = (
        select(Product)
        .order_by(Product.embedding.cosine_distance(query_vector))
        .limit(RAG_TOP_K)
    )
    result = await db.execute(stmt)
    products = list(result.scalars().all())

    if not products:
        logger.warning("[RAG] No products found for query: %s", query)
        return "No hay productos disponibles que coincidan.", []

    lines = ["Catálogo recuperado (fuentes para tu respuesta):"]
    for p in products:
        price_str = f"{p.price:,.0f}".replace(",", ".")
        lines.append(f"  • [{p.id}] {p.name} — ${price_str} | {p.tag}")

    context = "\n".join(lines)
    logger.debug("[RAG] Context built:\n%s", context)
    return context, products


async def resolve_product_ids(
    orders: List[dict], all_products: List[Product]
) -> List[CartAction]:
    """
    Cruza los nombres y cantidades extraídos por la IA con los productos reales 
    de la DB para obtener sus IDs, precios e imágenes.
    `orders` es una lista de: {"name": str, "quantity": int}
    """
    actions: List[CartAction] = []
    
    for order in orders:
        req_name = str(order.get("name", "")).lower().strip()
        try:
            req_qty = int(order.get("quantity", 1))
        except (TypeError, ValueError):
            req_qty = 1
        if not req_name or not 1 <= req_qty <= MAX_QTY_PER_ITEM:
            continue
            
        matched_product = None
        for product in all_products:
            db_name = product.name.lower()
            if req_name in db_name or db_name in req_name:
                matched_product = product
                break
                
        if matched_product:
            actions.append(CartAction(
                type="ADD_TO_CART",
                product_id=matched_product.id,
                product_name=matched_product.name,
                price=matched_product.price,
                image=matched_product.image,
                quantity=req_qty   # <--- Aplicamos la cantidad solicitada
            ))

    logger.info("[Cart] Resolved %d actions with quantities", len(actions))
    return actions


# Pregunta fija tras listar opciones: el nodo de compras la busca en el turno
# anterior para saber que la siguiente respuesta del cliente es su elección.
DISAMBIGUATION_QUESTION = "¿Cuál te gustaría agregar al carrito?"
MAX_QTY_PER_ITEM = 20  # Más que esto es un pedido especial, no una compra por chat

_STOPWORDS = {"de", "del", "la", "el", "los", "las", "un", "una", "uno", "unos", "unas", "y", "con"}
_FUZZY_CUTOFF = 0.8  # Tolera errores de tipeo ("cheescake" → "cheesecake")


def _tokens(text: str) -> List[str]:
    """Normaliza a tokens sin tildes, stopwords ni plural ("Maracuyá" → "maracuya")."""
    plain = unicodedata.normalize("NFD", text.lower())
    plain = "".join(c for c in plain if unicodedata.category(c) != "Mn")
    words = re.findall(r"[a-z]+", plain)
    return [w.rstrip("s") for w in words if w not in _STOPWORDS]


def _token_matches(token: str, name_tokens: List[str]) -> bool:
    return any(
        token == nt or SequenceMatcher(None, token, nt).ratio() >= _FUZZY_CUTOFF
        for nt in name_tokens
    )


def find_matching_products(req_name: str, catalog: List[Product]) -> List[Product]:
    """Devuelve los productos cuyo nombre contiene TODAS las palabras pedidas."""
    req_tokens = _tokens(req_name)
    if not req_tokens:
        return []
    return [
        p for p in catalog
        if all(_token_matches(t, _tokens(p.name)) for t in req_tokens)
    ]


async def get_all_products(db: AsyncSession) -> List[Product]:
    result = await db.execute(select(Product).order_by(Product.id))
    return list(result.scalars().all())


def resolve_multi_item_order(
    orders: List[dict], catalog: List[Product]
) -> tuple[List[CartAction], List[str]]:
    """
    Resuelve cada ítem de un pedido múltiple contra el catálogo COMPLETO.
    Retorna (acciones, avisos): los ítems que no se pueden identificar sin
    ambigüedad NO se agregan; generan un aviso para que el usuario aclare.
    """
    actions: List[CartAction] = []
    notices: List[str] = []

    for order in orders:
        req_name = str(order.get("name", "")).strip()
        try:
            quantity = int(order.get("quantity", 1))
        except (TypeError, ValueError):
            quantity = 1
        if quantity < 1:
            continue  # "cero brownies" o cantidades negativas: no se agrega nada
        if quantity > MAX_QTY_PER_ITEM:
            notices.append(
                f"Para pedir más de {MAX_QTY_PER_ITEM} unidades de \"{req_name}\" escríbenos directamente "
                "y preparamos tu pedido especial. 😊"
            )
            continue
        order = {**order, "quantity": quantity}
        matches = find_matching_products(req_name, catalog)

        if len(matches) == 1:
            product = matches[0]
            actions.append(CartAction(
                type="ADD_TO_CART",
                product_id=product.id,
                product_name=product.name,
                price=product.price,
                image=product.image,
                quantity=order.get("quantity", 1),
            ))
        elif matches:
            options = "\n".join(
                f"- **{p.name}** — ${p.price:,.0f}".replace(",", ".") for p in matches
            )
            notices.append(
                f"Para \"{req_name}\" tenemos varias opciones:\n\n{options}\n\n{DISAMBIGUATION_QUESTION} 😊"
            )
        else:
            notices.append(f"No encontré \"{req_name}\" en nuestro catálogo.")

    logger.info("[Cart] Multi-item: %d resolved, %d pending", len(actions), len(notices))
    return actions, notices


async def track_order(order_id: str, db: AsyncSession) -> str:
    """Busca un pedido por su ID (UUID) en la base de datos y retorna su estado formateado."""
    logger.info("[Order Tracking] Buscando pedido: %s", order_id)
    if not order_id:
        return "No me proporcionaste un número de pedido."
    
    # Limpiamos si el LLM extrajo espacios
    order_id = order_id.strip()

    stmt = select(Order).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalars().first()

    if not order:
        return f"No encontré ningún pedido con el número '{order_id}'. Por favor verifica que sea el correcto."
    
    # Traducción de estado
    estados_humanos = {
        "pendiente": "Pendiente de pago ⏳",
        "pagado": "Pagado y en preparación 🍰",
        "enviado": "En camino hacia ti 🚚",
        "entregado": "Entregado ✅",
        "cancelado": "Cancelado ❌",
    }
    estado_amigable = estados_humanos.get(order.status.value, order.status.value)

    return (
        f"¡Encontré tu pedido! (ID: {order.id})\n"
        f"Actualmente su estado es: **{estado_amigable}**.\n"
        f"El total fue de ${order.total_amount:,.0f}."
    )

