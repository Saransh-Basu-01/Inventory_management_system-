from pydantic import BaseModel, Field, field_validator
from typing import Optional, TYPE_CHECKING
from datetime import datetime
from enum import Enum


class TransactionType(str, Enum):
    STOCK_IN = "stock_in"
    STOCK_OUT = "stock_out"
    ADJUSTMENT = "adjustment"
    RETURN = "return"


class InventoryTransactionBase(BaseModel):
    product_id: int = Field(..., gt=0)
    transaction_type: TransactionType
    quantity: int = Field(..., description="Quantity (positive or negative)")
    unit_price: Optional[float] = Field(None, ge=0)
    total_price: Optional[float] = Field(None, ge=0)
    reference_number: Optional[str] = Field(None, max_length=100, description="Invoice/PO number")
    notes: Optional[str] = Field(None, max_length=255)
    
    @field_validator('total_price')
    def calculate_total_price(cls, v, values):
        """Auto-calculate total_price if not provided"""
        if v is None and 'quantity' in values and 'unit_price' in values:
            if values['unit_price'] is not None:
                return values['quantity'] * values['unit_price']
        return v


class InventoryTransactionCreate(InventoryTransactionBase):
    pass


class InventoryTransactionUpdate(BaseModel):
    transaction_type: Optional[TransactionType] = None
    quantity: Optional[int] = None
    unit_price: Optional[float] = Field(None, ge=0)
    total_price: Optional[float] = Field(None, ge=0)
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class InventoryTransactionResponse(InventoryTransactionBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# With related data (product and user info)
if TYPE_CHECKING:
    from .product import ProductResponse
    from .user import UserResponse


class InventoryTransactionWithDetails(InventoryTransactionResponse):
    product: Optional['ProductResponse'] = None
    user: Optional['UserResponse'] = None
    
    class Config:
        from_attributes = True



# Important Config Options:
# A. from_attributes = True (Pydantic V2)
# orm_mode = True (Pydantic V1)
# What it does: Allows Pydantic to work with SQLAlchemy models