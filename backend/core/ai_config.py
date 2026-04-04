"""
core/ai_config.py
-----------------
Single source of truth for AI model selection.
All LangGraph nodes and services MUST read from here — never hardcode model names.
Override via environment variables to swap models without touching application code.
"""
import os

# ── Triage / Routing ──────────────────────────────────────────────────────────
TRIAGE_MODEL: str = os.getenv("TRIAGE_MODEL", "gpt-4o-mini")
TRIAGE_TEMPERATURE: float = float(os.getenv("TRIAGE_TEMPERATURE", "0.0"))  # Deterministic

# ── Generation nodes ──────────────────────────────────────────────────────────
RECIPE_MODEL: str = os.getenv("RECIPE_MODEL", "gpt-4o-mini")
RECIPE_TEMPERATURE: float = float(os.getenv("RECIPE_TEMPERATURE", "0.15"))

PURCHASE_MODEL: str = os.getenv("PURCHASE_MODEL", "gpt-4o-mini")
PURCHASE_TEMPERATURE: float = float(os.getenv("PURCHASE_TEMPERATURE", "0.05"))

INFO_MODEL: str = os.getenv("INFO_MODEL", "gpt-4o-mini")
INFO_TEMPERATURE: float = float(os.getenv("INFO_TEMPERATURE", "0.15"))

# ── Embeddings ────────────────────────────────────────────────────────────────
EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

# ── RAG ───────────────────────────────────────────────────────────────────────
RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "3"))

# ── Context window ────────────────────────────────────────────────────────────
HISTORY_WINDOW: int = int(os.getenv("HISTORY_WINDOW", "8"))  # Messages to keep
