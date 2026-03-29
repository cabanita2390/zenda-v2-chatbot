from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from .products_model import Product
from .products_schema import ProductCreate

class ProductsService:
    """ Equivalent to an @Injectable() Service in NestJS """
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def find_all(self) -> List[Product]:
        result = await self.db.execute(select(Product))
        return list(result.scalars().all())
    
    async def find_one(self, product_id: int) -> Optional[Product]:
        result = await self.db.execute(select(Product).where(Product.id == product_id))
        return result.scalar_one_or_none()
        
    async def create(self, product_in: ProductCreate) -> Product:
        db_product = Product(**product_in.model_dump())
        self.db.add(db_product)
        await self.db.commit()
        await self.db.refresh(db_product)
        return db_product
