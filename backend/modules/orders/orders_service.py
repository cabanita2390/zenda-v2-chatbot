from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import Optional, List

from .orders_model import Order, OrderItem, Customer, OrderStatus
from .orders_schema import OrderCreate, CustomerCreate
from modules.products.products_model import Product
from fastapi import HTTPException, status

class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_or_create_customer(self, customer_data: CustomerCreate) -> Customer:
        stmt = select(Customer).where(Customer.email == customer_data.email)
        result = await self.db.execute(stmt)
        customer = result.scalars().first()

        if not customer:
            customer = Customer(
                email=customer_data.email,
                name=customer_data.name,
                phone=customer_data.phone
            )
            self.db.add(customer)
            await self.db.flush() # Flush to get the ID without committing
        else:
            # Update info if name/phone changed
            customer.name = customer_data.name
            if customer_data.phone:
                customer.phone = customer_data.phone
                
        return customer

    async def create_order(self, order_data: OrderCreate) -> Order:
        # 1. Handle Customer
        customer = await self._get_or_create_customer(order_data.customer)

        # 2. Calculate Total & Prepare Items
        total_amount = 0.0
        order_items = []
        
        for item_data in order_data.items:
            # Fetch product to get current price and validate it exists
            stmt = select(Product).where(Product.id == item_data.product_id)
            result = await self.db.execute(stmt)
            product = result.scalars().first()

            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"El producto con ID {item_data.product_id} no fue encontrado."
                )

            # Calculate item logic
            line_price = product.price * item_data.quantity
            total_amount += line_price

            order_items.append(
                OrderItem(
                    product_id=product.id,
                    quantity=item_data.quantity,
                    unit_price=product.price
                )
            )

        # 3. Create Order
        new_order = Order(
            customer_id=customer.id,
            total_amount=total_amount,
            shipping_address=order_data.shipping_address,
            status=OrderStatus.PENDING,
            items=order_items
        )

        self.db.add(new_order)
        await self.db.commit()
        
        # Reload order with relationships
        stmt_reload = select(Order).options(
            selectinload(Order.customer),
            selectinload(Order.items)
        ).where(Order.id == new_order.id)
        res = await self.db.execute(stmt_reload)
        return res.scalars().first()

    async def get_order(self, order_id: str) -> Optional[Order]:
        stmt = select(Order).options(
            selectinload(Order.customer),
            selectinload(Order.items)
        ).where(Order.id == order_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def update_order_status(self, order_id: str, new_status: OrderStatus) -> Order:
        order = await self.get_order(order_id)
        if not order:
             raise HTTPException(status_code=404, detail="Pedido no encontrado")
        
        order.status = new_status
        await self.db.commit()
        return order
