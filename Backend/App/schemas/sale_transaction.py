from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from .sale import SaleBase
from .sale_item import SaleItemCreate


class SaleItemInput(BaseModel):
    """Schema for adding items when creating a sale"""
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)


class SaleTransactionCreate(SaleBase):
    """Complete sale with items"""
    items: List[SaleItemInput] = Field(..., min_items=1, description="At least one item required")
    
    @field_validator('items')
    def validate_items(cls, v):
        if not v:
            raise ValueError('Sale must have at least one item')
        return v


class SaleTransactionResponse(BaseModel):
    """Response after creating a complete sale"""
    sale_id: int
    invoice_number: str
    total_amount: float
    total_items: int
    customer_name: Optional[str] = None
    created_at: str
    message: str = "Sale created successfully"
    
    class Config:
        from_attributes = True