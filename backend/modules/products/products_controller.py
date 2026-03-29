from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from core.database import get_db
from .products_schema import ProductResponse, ProductCreate
from .products_service import ProductsService

router = APIRouter(
    prefix="/api/products",
    tags=["Products"]
)

# Inyección de dependencias para el servicio
async def get_products_service(db: AsyncSession = Depends(get_db)) -> ProductsService:
    return ProductsService(db)

@router.get("/", response_model=List[ProductResponse])
async def get_all_products(service: ProductsService = Depends(get_products_service)):
    return await service.find_all()

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product_by_id(product_id: int, service: ProductsService = Depends(get_products_service)):
    product = await service.find_one(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

@router.post("/", response_model=ProductResponse)
async def create_product(product_in: ProductCreate, service: ProductsService = Depends(get_products_service)):
    return await service.create(product_in)
