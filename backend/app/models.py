import time
from sqlalchemy import Column, String, Float, Boolean, Integer
from .database import Base

class ShoppingItemModel(Base):
    __tablename__ = "shopping_items"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    category_id = Column(String, nullable=False, index=True, default="otros")
    brand = Column(String, nullable=False, default="General")
    quantity = Column(Float, nullable=False, default=1.0)
    unit = Column(String, nullable=False, default="ud")
    estimated_price = Column(Float, nullable=True)
    notes = Column(String, nullable=True)
    completed = Column(Boolean, nullable=False, default=False)
    priority = Column(String, nullable=False, default="media")
    created_at = Column(Integer, default=lambda: int(time.time() * 1000))
