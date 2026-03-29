import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from langchain_openai import OpenAIEmbeddings

from core.database import AsyncSessionLocal, engine, Base
from core.config import settings
from modules.products.products_model import Product

MOCK_PRODUCTS = [
    {"name": "Parfait de Chia y Bayas", "price": 12.00, "tag": "Sin Azucar", "image": "/images/products/chia-parfait.jpg"},
    {"name": "Tarta de Chocolate Negro", "price": 16.00, "tag": "Vegano", "image": "/images/products/dark-chocolate.jpg"},
    {"name": "Cheesecake de Matcha", "price": 14.00, "tag": "Keto", "image": "/images/products/matcha-cheesecake.jpg"},
    {"name": "Mousse de Avellana", "price": 13.00, "tag": "Sin Gluten", "image": "/images/products/hazelnut-mousse.jpg"},
    {"name": "Brownie de Almendras", "price": 10.00, "tag": "Vegano", "image": "/images/products/almond-brownie.jpg"},
    {"name": "Panna Cotta de Coco", "price": 11.00, "tag": "Sin Lactosa", "image": "/images/products/coconut-panna.jpg"},
]

async def seed_db():
    print("Iniciando modelos de OpenAI Embeddings...")
    if not settings.OPENAI_API_KEY:
        print("ERROR: Falta OPENAI_API_KEY en el entorno")
        return
        
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small", api_key=settings.OPENAI_API_KEY)
    
    async with engine.begin() as conn:
        print("Activando extensión pgvector en PostgreSQL...")
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        print("Borrando tablas antiguas para recrearlas...")
        await conn.run_sync(Base.metadata.drop_all)
        print("Creando tablas con nueva columna vectorial...")
        await conn.run_sync(Base.metadata.create_all)

    print("Generando vectores a través de OpenAI (esto tomará unos segundos)...")
    async with AsyncSessionLocal() as session:
        for p_data in MOCK_PRODUCTS:
            text_to_embed = f"Producto: {p_data['name']}. Precio: ${p_data['price']} USD. Categoria/Tag: {p_data['tag']}."
            vector = await embeddings.aembed_query(text_to_embed)
            
            product = Product(**p_data, embedding=vector)
            session.add(product)
        await session.commit()
    print("Base de datos repoblada con Embeddings vectoriales de OpenAI exitosamente!")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_db())
