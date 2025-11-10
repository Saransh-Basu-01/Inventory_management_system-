from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# Nested schemas for relationships
class SupplierInProduct(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True


class CategoryInProduct(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True


# Base schema (shared fields)
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Product name")
    sku: str = Field(..., min_length=1, max_length=50, description="Stock Keeping Unit")
    quantity: int = Field(default=0, ge=0, description="Must be >= 0")
    price: float = Field(..., gt=0, description="Must be > 0")
    reorder_level: int = Field(default=10, ge=0)
    supplier_id: int = Field(..., description="Supplier ID is required")
    category_id: Optional[int] = None


# For creating a product (POST request)
class ProductCreate(ProductBase):
    pass


# For updating a product (PATCH request)
class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    sku: Optional[str] = Field(None, min_length=1, max_length=50)
    quantity: Optional[int] = Field(None, ge=0)
    price: Optional[float] = Field(None, gt=0)
    reorder_level: Optional[int] = Field(None, ge=0)
    supplier_id: Optional[int] = None
    category_id: Optional[int] = None


# For returning a product (GET response) - THIS IS THE KEY
class ProductResponse(BaseModel):
    id: int
    name: str
    sku: str
    quantity: int
    price: float
    reorder_level: int
    supplier_id: int
    category_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    # ADD THESE - nested objects for supplier and category
    supplier: Optional[SupplierInProduct] = None
    category: Optional[CategoryInProduct] = None
    
    class Config:
        from_attributes = True