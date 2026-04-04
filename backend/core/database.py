import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

# Both keys needed for full pgBouncer/asyncpg compatibility across versions:
# - statement_cache_size       → asyncpg < 0.27
# - prepared_statement_cache_size → asyncpg >= 0.27
# pool_pre_ping avoids stale connection errors on reconnect.
db_url = os.getenv("DATABASE_URL")

if not db_url:
    print("❌ ERROR: DATABASE_URL variable is missing! Check Render environment variables.", flush=True)
    # Creamos un motor de 'mentira' para evitar que la importación falle y ver el error en logs
    engine = create_async_engine("sqlite+aiosqlite:///:memory:") 
else:
    try:
        engine = create_async_engine(
            db_url,
            echo=False,
            pool_pre_ping=True,
            connect_args={
                "statement_cache_size": 0,
                "prepared_statement_cache_size": 0,
            },
        )
    except Exception as e:
        print(f"❌ ERROR: Failed to create database engine: {e}", flush=True)
        engine = create_async_engine("sqlite+aiosqlite:///:memory:")



AsyncSessionLocal = async_sessionmaker(
    bind=engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    """ Dependency to inject database sessions into services """
    async with AsyncSessionLocal() as session:
        yield session
