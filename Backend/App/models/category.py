from sqlalchemy import Column, Integer, String, Text, DateTime,ForeignKey
from App.database import Base
from datetime import datetime
from sqlalchemy.orm import relationship

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)# Category model snippet to add 
    products = relationship("Product", back_populates="category")
