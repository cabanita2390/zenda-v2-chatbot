"""
core/logging_config.py
----------------------
Colored terminal logging for the Zenda backend.

Traffic-light color scheme:
  🟢 GREEN  → INFO   (success, normal flow)
  🟡 YELLOW → WARNING (unexpected but non-fatal)
  🔴 RED    → ERROR / CRITICAL (failures, exceptions)
  ⚪ GREY   → DEBUG  (verbose dev tracing)

Usage:
    from core.logging_config import setup_logging
    setup_logging()   # call once in main.py before any other import

Each logger in the app will then automatically use these colors.
"""
import logging
import sys


# ── ANSI color codes ──────────────────────────────────────────────────────────
_RESET = "\033[0m"
_BOLD  = "\033[1m"

_COLORS = {
    logging.DEBUG:    "\033[90m",   # Dark grey
    logging.INFO:     "\033[92m",   # 🟢 Bright green
    logging.WARNING:  "\033[93m",   # 🟡 Bright yellow
    logging.ERROR:    "\033[91m",   # 🔴 Bright red
    logging.CRITICAL: "\033[91m" + _BOLD,  # 🔴 Bold red
}

_LEVEL_EMOJI = {
    logging.DEBUG:    "⚙",
    logging.INFO:     "✅",
    logging.WARNING:  "⚠️",
    logging.ERROR:    "❌",
    logging.CRITICAL: "🔥",
}


class ColoredFormatter(logging.Formatter):
    """
    Custom formatter that prepends ANSI colors and emoji to each log record.
    Falls back to plain text if the terminal doesn't support ANSI codes.
    """

    _FMT = "{color}{emoji} [{levelname}] {name}: {message}{reset}"

    def format(self, record: logging.LogRecord) -> str:
        color = _COLORS.get(record.levelno, "")
        emoji = _LEVEL_EMOJI.get(record.levelno, "•")

        # Format without color first (for file handlers / CI environments)
        formatted = super().format(record)

        # Apply color and emoji
        return (
            f"{color}{emoji} [{record.levelname}] "
            f"{record.name}: {record.getMessage()}{_RESET}"
        )


def setup_logging(level: int = logging.DEBUG) -> None:
    """
    Configure the root logger with a colored StreamHandler.
    Call this ONCE at the top of main.py after load_dotenv().

    Suppresses noisy SQLAlchemy engine logs while keeping application logs visible.
    """
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(ColoredFormatter())

    # Root logger
    root = logging.getLogger()
    root.setLevel(level)
    root.handlers.clear()
    root.addHandler(handler)

    # Suppress verbose third-party loggers
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)
    logging.getLogger("langchain").setLevel(logging.WARNING)
    logging.getLogger("langfuse").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)

    # ── Application Heartbeat ────────────────────────────────────────────────
    logger = logging.getLogger("core.logging_config")
    logger.info("Logging system initialized (Level=%s) 🚀", logging.getLevelName(level))
    print("✨ [DEBUG] Standard output (stdout) is ready and flushing.", flush=True)
