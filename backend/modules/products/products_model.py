from sqlalchemy import Column, Integer, String, Float
from pgvector.sqlalchemy import Vector
from core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    price = Column(Float, nullable=False)
    tag = Column(String, nullable=True)
    image = Column(String, nullable=True)
    
    # Vector de 1536 dimensiones correspondiente a OpenAI text-embedding-3-small
    embedding = Column(Vector(1536))
