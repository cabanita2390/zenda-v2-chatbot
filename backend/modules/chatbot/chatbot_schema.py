"""
chatbot_schema.py
-----------------
Pydantic DTOs for the Chatbot module.

Includes:
- HealthyDessert: domain model mirroring the products DB entity.
- CartAction: structured action returned by the purchase node.
- ChatMessage / ChatRequest / ChatResponse: HTTP contract.
"""
from __future__ import annotations

from typing import List, Literal, Optional
from pydantic import BaseModel, Field


# ── Domain Models ─────────────────────────────────────────────────────────────

class HealthyDessert(BaseModel):
    """Domain model matching the `products` table schema."""
    id: int
    name: str
    price: float
    tag: str   # e.g. "Vegano", "Sin Gluten", "Keto"
    image: Optional[str] = None


# ── Action Models ─────────────────────────────────────────────────────────────

class CartAction(BaseModel):
    """
    Structured action that the frontend must dispatch.
    Currently only ADD_TO_CART is supported.
    """
    type: Literal["ADD_TO_CART"]
    product_id: int
    product_name: str   # Included for frontend toast/UX messages


# ── HTTP Contract ─────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., min_length=1)


class ChatResponse(BaseModel):
    reply: str
    actions: List[CartAction] = Field(default_factory=list)
    intent: Optional[str] = None  # Exposed for frontend debug / LangFuse correlation
