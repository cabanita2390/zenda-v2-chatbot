import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import AsyncSessionLocal, engine, Base
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
    print("Creando tablas si no existen...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("Insertando productos iniciales...")
    async with AsyncSessionLocal() as session:
        for p_data in MOCK_PRODUCTS:
            product = Product(**p_data)
            session.add(product)
        await session.commit()
    print("Base de datos poblada exitosamente!")
    
    # Cerrar conexiones cleanly
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_db())
