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
from typing import List

from langchain_openai import OpenAIEmbeddings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.ai_config import EMBEDDING_MODEL, RAG_TOP_K
from modules.products.products_model import Product
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
        req_name = order.get("name", "").lower().strip()
        req_qty = order.get("quantity", 1)
        if not req_name:
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

