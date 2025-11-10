from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from App.database import Base
from datetime import datetime


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    sku = Column(String(50), unique=True, nullable=False)
    quantity = Column(Integer, default=0)
    price = Column(Float)
    reorder_level = Column(Integer, default=10)
    
    # Foreign keys - define BEFORE relationships
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - define AFTER foreign keys
    supplier = relationship("Supplier", back_populates="products", lazy="joined")
    category = relationship("Category", back_populates="products", lazy="joined")
    inventory_transactions = relationship("InventoryTransaction", back_populates="product")