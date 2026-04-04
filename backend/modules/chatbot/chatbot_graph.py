"""
chatbot_graph.py
----------------
LangGraph StateGraph orchestrator for the Zenda AI assistant.

This file is now a lightweight assembler that imports specialized
agent nodes from the `nodes/` package and wires them together.

Flow:
  START → triage → [recipe | purchase | info | greeting | track_order] → END
"""
from __future__ import annotations

import logging
import os

from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from sqlalchemy.ext.asyncio import AsyncSession

from core import ai_config
from .chatbot_state import GraphState

# ── Agent node factories ─────────────────────────────────────────────────────
from .nodes.triage import create_triage_node
from .nodes.recipe import create_recipe_node
from .nodes.purchase import create_purchase_node
from .nodes.info import create_info_node
from .nodes.track_order import create_track_order_node
from .nodes.greeting import create_greeting_node

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# Graph factory
# ──────────────────────────────────────────────────────────────────────────────

def build_graph(db: AsyncSession) -> StateGraph:
    """
    Build and compile the LangGraph StateGraph.
    Each node is created via its factory, receiving the appropriate LLM and DB.
    """

    # ── LLM clients ──────────────────────────────────────────────────────────
    api_key = os.getenv("OPENAI_API_KEY")

    triage_llm = ChatOpenAI(model=ai_config.TRIAGE_MODEL, temperature=ai_config.TRIAGE_TEMPERATURE, api_key=api_key)
    recipe_llm = ChatOpenAI(model=ai_config.RECIPE_MODEL, temperature=ai_config.RECIPE_TEMPERATURE, api_key=api_key)
    purchase_llm = ChatOpenAI(model=ai_config.PURCHASE_MODEL, temperature=ai_config.PURCHASE_TEMPERATURE, api_key=api_key)
    info_llm = ChatOpenAI(model=ai_config.INFO_MODEL, temperature=ai_config.INFO_TEMPERATURE, api_key=api_key)

    # ── Create agent nodes ───────────────────────────────────────────────────
    triage_node = create_triage_node(triage_llm)
    recipe_node = create_recipe_node(recipe_llm, db)
    purchase_node = create_purchase_node(purchase_llm, db)
    info_node = create_info_node(info_llm, db)
    track_order_node = create_track_order_node(info_llm, db)
    greeting_node = create_greeting_node(info_llm)

    # ── Router ───────────────────────────────────────────────────────────────
    def route_by_intent(state: GraphState) -> str:
        intent = state.get("intent", "info")
        logger.debug("[Router] Routing to node: %s", intent)
        return intent

    # ── Assemble graph ───────────────────────────────────────────────────────
    graph = StateGraph(GraphState)

    graph.add_node("triage", triage_node)
    graph.add_node("recipe", recipe_node)
    graph.add_node("purchase", purchase_node)
    graph.add_node("info", info_node)
    graph.add_node("greeting", greeting_node)
    graph.add_node("track_order", track_order_node)

    graph.add_edge(START, "triage")
    graph.add_conditional_edges(
        "triage",
        route_by_intent,
        {
            "recipe": "recipe",
            "purchase": "purchase",
            "info": "info",
            "greeting": "greeting",
            "track_order": "track_order",
        },
    )
    graph.add_edge("recipe", END)
    graph.add_edge("purchase", END)
    graph.add_edge("info", END)
    graph.add_edge("greeting", END)
    graph.add_edge("track_order", END)

    return graph.compile()
