from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime


class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    contact_person: Optional[str] = Field(None, max_length=100)
    email: EmailStr  # Validates email format
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=255)


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class SupplierResponse(SupplierBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# For listing supplier with their products
if TYPE_CHECKING:
    from .product import ProductResponse


class SupplierWithProducts(SupplierResponse):
    products: List['ProductResponse'] = []
    
    class Config:
        from_attributes = True