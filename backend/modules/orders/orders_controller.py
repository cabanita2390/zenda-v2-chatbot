from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from core.database import get_db
from .orders_schema import OrderCreate, OrderResponse
from .orders_service import OrderService
from .orders_model import OrderStatus

router = APIRouter(
    prefix="/orders",
    tags=["orders"]
)

def get_orders_service(db: AsyncSession = Depends(get_db)):
    return OrderService(db)

@router.post("/", response_model=OrderResponse, status_code=201)
async def create_new_order(
    order_in: OrderCreate,
    service: OrderService = Depends(get_orders_service)
):
    try:
        order = await service.create_order(order_data=order_in)
        return order
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_by_id(
    order_id: str,
    service: OrderService = Depends(get_orders_service)
):
    order = await service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return order
