from pydantic import BaseModel, Field, validator
from typing import Optional, TYPE_CHECKING
from datetime import datetime


# Base schema (shared fields)
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Product name")
    sku: str = Field(..., min_length=1, max_length=50, description="Stock Keeping Unit")
    category: Optional[str] = Field(None, max_length=50)
    quantity: int = Field(default=0, ge=0, description="Must be >= 0")
    price: float = Field(..., gt=0, description="Must be > 0")
    reorder_level: int = Field(default=10, ge=0)
    supplier_id: Optional[int] = None


# For creating a product (POST request)
class ProductCreate(ProductBase):
    pass  # Inherits all fields from ProductBase


# For updating a product (PUT/PATCH request)
class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    sku: Optional[str] = Field(None, min_length=1, max_length=50)
    category: Optional[str] = None
    quantity: Optional[int] = Field(None, ge=0)
    price: Optional[float] = Field(None, gt=0)
    reorder_level: Optional[int] = Field(None, ge=0)
    supplier_id: Optional[int] = None


# For returning a product (GET response)
class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True  # Allows Pydantic to work with SQLAlchemy models
        # (In older Pydantic versions, use: orm_mode = True)


# For listing products with supplier info
if TYPE_CHECKING:
    from .supplier import SupplierResponse


class ProductWithSupplier(ProductResponse):
    supplier: Optional['SupplierResponse'] = None
    
    class Config:
        from_attributes = True

