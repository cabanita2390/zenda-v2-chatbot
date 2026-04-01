from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from .orders_model import OrderStatus

# --- Customes ---
class CustomerBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int

    class Config:
        from_attributes = True

# --- Order Items ---
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: int
    unit_price: float

    class Config:
        from_attributes = True

# --- Orders ---
class OrderBase(BaseModel):
    shipping_address: Optional[str] = None
    
class OrderCreate(OrderBase):
    customer: CustomerCreate
    items: List[OrderItemCreate]

class OrderResponse(OrderBase):
    id: str
    status: OrderStatus
    total_amount: float
    created_at: datetime
    customer: CustomerResponse
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True
