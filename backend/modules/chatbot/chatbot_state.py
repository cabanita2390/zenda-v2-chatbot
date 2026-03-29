"""
chatbot_state.py
----------------
LangGraph StateGraph state definition.

Every node in the graph receives this full state dict
and returns a partial dict with only the keys it mutates.
"""
from __future__ import annotations

from typing import TypedDict, List, Optional, Literal
from .chatbot_schema import ChatMessage, CartAction


class GraphState(TypedDict, total=False):
    # ── Input ──────────────────────────────────────────────────────────────
    messages: List[ChatMessage]                        # Full conversation history

    # ── Triage output ───────────────────────────────────────────────────────
    intent: Optional[Literal["recipe", "purchase", "info"]]

    # ── RAG output ──────────────────────────────────────────────────────────
    context: Optional[str]                             # Formatted product context

    # ── Final outputs ───────────────────────────────────────────────────────
    reply: Optional[str]                              # LLM-generated text
    actions: List[CartAction]                         # Cart actions for frontend
