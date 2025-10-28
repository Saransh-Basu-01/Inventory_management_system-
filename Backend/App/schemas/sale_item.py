from pydantic import BaseModel, Field, field_validator
from typing import Optional,TYPE_CHECKING
from datetime import datetime


class SaleItemBase(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0, description="Must be greater than 0")
    unit_price: float = Field(..., gt=0, description="Must be greater than 0")
    total_price: Optional[float] = Field(None, ge=0)
    
    @field_validator('total_price', always=True)
    def calculate_total_price(cls, v, values):
        """Auto-calculate total_price if not provided"""
        if v is None and 'quantity' in values and 'unit_price' in values:
            return values['quantity'] * values['unit_price']
        return v


class SaleItemCreate(SaleItemBase):
    pass


class SaleItemUpdate(BaseModel):
    product_id: Optional[int] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, gt=0)
    unit_price: Optional[float] = Field(None, gt=0)
    total_price: Optional[float] = None


class SaleItemResponse(SaleItemBase):
    id: int
    sale_id: int
    
    class Config:
        from_attributes = True


# With product details
# Type checking import
if TYPE_CHECKING:
    from .product import ProductResponse


class SaleItemWithProduct(SaleItemResponse):
    product: Optional['ProductResponse'] = None
    
    class Config:
        from_attributes = True