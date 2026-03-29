from pydantic import BaseModel
from typing import Optional

class ProductBase(BaseModel):
    name: str
    price: float
    tag: Optional[str] = None
    image: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True
