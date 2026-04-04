# ── IMPORTANT: load .env BEFORE any other local imports ──────────────────────
from dotenv import load_dotenv
load_dotenv()

from core.logging_config import setup_logging
setup_logging()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from core.database import engine, Base
from modules.products.products_controller import router as products_router
from modules.chatbot.chatbot_controller import router as chatbot_router
from modules.orders.orders_controller import router as orders_router
from modules.orders import orders_model # Import for Base.metadata inference

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start-up: Crea las tablas si no existen (ideal para desarrollo local veloz)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: Cierra la conexión
    await engine.dispose()

app = FastAPI(
    title="Zenda E-commerce Backend",
    description="Backend modular con Postgres y FastAPI estilo NestJS",
    version="1.0.0",
    lifespan=lifespan
)

import os

# Configuración dinámica de CORS para producción
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

# Registrar los controladores (Routers)
app.include_router(products_router)
app.include_router(chatbot_router)
app.include_router(orders_router)
