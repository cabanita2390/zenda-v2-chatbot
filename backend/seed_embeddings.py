from dotenv import load_dotenv
load_dotenv()

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from langchain_openai import OpenAIEmbeddings

from core.database import AsyncSessionLocal, engine, Base
from core.config import settings
from modules.products.products_model import Product

# --- NIVEL 4: CONTEXTO GLOBAL (Contextual Retrieval) ---
STORE_CONTEXT = (
    "Zenda es una pastelería saludable de especialidad. "
    "Nuestra misión es transformar la repostería tradicional en opciones nutritivas, "
    "utilizando técnicas artesanales e ingredientes naturales de alta calidad para "
    "personas con dietas restringidas (vegano, keto, sin azúcar, sin gluten) o que buscan bienestar."
)

# --- DESCRIPCIONES RICAS (Generadas con el paso anterior) ---
DESCRIPTIONS = {
    "Parfait de Chia y Bayas": "Capas cremosas y frescas que combinan semillas de chía hidratadas con una mezcla vibrante de bayas naturales. Rico en antioxidantes y omega-3, es de bajo índice glucémico.",
    "Tarta de Chocolate Negro": "Intensa y profunda en sabor, destaca por su chocolate negro de alta pureza. Libre de ingredientes animales y rica en antioxidantes.",
    "Cheesecake de Matcha": "Suave y equilibrado, combina el toque terroso del matcha con una textura cremosa. Aporta antioxidantes y energía sostenida (Keto).",
    "Mousse de Avellana": "Aireado y sedoso, sabor profundo a avellana tostada. Libre de gluten y rico en grasas saludables.",
    "Brownie de Almendras": "Denso y húmedo, sabor intenso a cacao con el toque tostado de las almendras. Alto en grasas saludables y proteína vegetal.",
    "Panna Cotta de Coco": "Delicada y cremosa, textura suave que se funde en la boca. Sin lactosa, ideal para una digestión ligera.",
    "Cheesecake de Frutos Rojos": "Suave y delicado, combina una base ligeramente crujiente con un relleno cremoso y equilibrado. Los frutos rojos aportan un toque ácido natural.",
    "Cheesecake de Manzana": "Mezcla reconfortante de sabores donde la suavidad del relleno se combina con el dulzor natural de la manzana. Rico en fibra.",
    "Cheesecake de Uchuva": "Exótico y refrescante, resalta el sabor ácido y ligeramente dulce de la uchuva. Fuente de vitamina C.",
    "Cheesecake de Maracuyá y Mango": "Tropical y vibrante, combina la acidez del maracuyá con la dulzura suave del mango. Rico en vitaminas y enzimas digestivas."
}

MOCK_PRODUCTS = [
    {"name": "Parfait de Chia y Bayas", "price": 12000, "tag": "Sin Azucar", "image": "/images/products/chia-parfait.jpg"},
    {"name": "Tarta de Chocolate Negro", "price": 16000, "tag": "Vegano", "image": "/images/products/dark-chocolate.jpg"},
    {"name": "Cheesecake de Matcha", "price": 14000, "tag": "Keto", "image": "/images/products/matcha-cheesecake.jpg"},
    {"name": "Mousse de Avellana", "price": 13000, "tag": "Sin Gluten", "image": "/images/products/hazelnut-mousse.jpg"},
    {"name": "Brownie de Almendras", "price": 10000, "tag": "Vegano", "image": "/images/products/almond-brownie.jpg"},
    {"name": "Panna Cotta de Coco", "price": 11000, "tag": "Sin Lactosa", "image": "/images/products/coconut-panna.jpg"},
    {"name": "Cheesecake de Frutos Rojos", "price": 15000, "tag": "Saludable", "image": "/images/products/cheescake-frutos-rojos-2.png"},
    {"name": "Cheesecake de Manzana", "price": 14000, "tag": "Fibra", "image": "/images/products/cheescake-manzana.png"},
    {"name": "Cheesecake de Uchuva", "price": 15500, "tag": "Vitamina C", "image": "/images/products/Cheesecake_de_Uchuva.png"},
    {"name": "Cheesecake de Maracuyá y Mango", "price": 16000, "tag": "Digestivo", "image": "/images/products/Cheesecake_de_maracuya_y_mango.png"},
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
            # --- CONSTRUCCIÓN DEL TEXTO CONTEXTUAL (NIVEL 4) ---
            desc = DESCRIPTIONS.get(p_data['name'], "")
            text_to_embed = (
                f"TIENDA: {STORE_CONTEXT}\n"
                f"PRODUCTO: {p_data['name']}\n"
                f"PRECIO: ${p_data['price']} COP\n"
                f"TAG/CATEGORIA: {p_data['tag']}\n"
                f"SABORES Y BENEFICIOS: {desc}"
            )
            
            print(f"📦 Procesando: {p_data['name']}")
            vector = await embeddings.aembed_query(text_to_embed)
            
            product = Product(**p_data, embedding=vector)
            session.add(product)
            
        print("Guardando en la base de datos...")
        await session.commit()
        
    print("Base de datos repoblada con Embeddings vectoriales de OpenAI exitosamente!")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_db())
