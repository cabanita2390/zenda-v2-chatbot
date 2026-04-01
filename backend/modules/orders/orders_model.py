from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from core.database import Base

class OrderStatus(str, enum.Enum):
    PENDING = "pendiente"
    PAID = "pagado"
    SHIPPED = "enviado"
    DELIVERED = "entregado"
    CANCELLED = "cancelado"

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)

    orders = relationship("Order", back_populates="customer")

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    total_amount = Column(Float, nullable=False)
    shipping_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False) # Refers to products_model.py
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False) # Price at the time of purchase

    order = relationship("Order", back_populates="items")
