import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

# Both keys needed for full pgBouncer/asyncpg compatibility across versions:
# - statement_cache_size       → asyncpg < 0.27
# - prepared_statement_cache_size → asyncpg >= 0.27
# pool_pre_ping avoids stale connection errors on reconnect.
engine = create_async_engine(
    os.getenv("DATABASE_URL", ""),
    echo=False,   # SQL echo disabled; use colored app-level logging instead
    pool_pre_ping=True,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    },
)



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
