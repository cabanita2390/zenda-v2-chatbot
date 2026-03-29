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
        lines.append(f"  • [{p.id}] {p.name} — ${p.price:.2f} | {p.tag}")

    context = "\n".join(lines)
    logger.debug("[RAG] Context built:\n%s", context)
    return context, products


async def resolve_product_ids(
    names: List[str], all_products: List[Product]
) -> List[CartAction]:
    """
    Match product names (mentioned in user message) to their DB IDs.
    Returns a list of CartAction ready to be sent to the frontend.
    """
    actions: List[CartAction] = []
    
    for name in names:
        req_name = name.lower().strip()
        if not req_name:
            continue
            
        matched_product = None
        # Try finding a product where the extracted name matches a portion of the real DB name
        for product in all_products:
            db_name = product.name.lower()
            # If the user typed "Panna Cotta", it matches "Panna Cotta de Coco"
            # If the LLM returned "Matcha", it matches "Cheesecake de Matcha"
            if req_name in db_name or db_name in req_name:
                matched_product = product
                break
                
        if matched_product:
            actions.append(CartAction(
                type="ADD_TO_CART",
                product_id=matched_product.id,
                product_name=matched_product.name,
            ))

    logger.info("[Cart] Resolved %d actions from %d requested names", len(actions), len(names))
    return actions
