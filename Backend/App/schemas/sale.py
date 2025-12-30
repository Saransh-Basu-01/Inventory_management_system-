from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List,TYPE_CHECKING
from datetime import datetime


class SaleItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price:  float
    total_price:  float
    product:  Optional[dict] = None

    class Config:
        from_attributes = True
class SaleBase(BaseModel):
    customer_name: Optional[str] = Field(None, max_length=100)
    customer_email: Optional[EmailStr] = None
    customer_phone: Optional[str] = Field(None, max_length=20)
    payment_method: Optional[str] = Field(None, max_length=50, description="Cash, Card, UPI, etc.")
    
    @field_validator('customer_phone')
    def validate_phone(cls, v):
        if v and not v.replace('+', '').replace('-', '').replace(' ', '').isdigit():
            raise ValueError('Invalid phone number format')
        return v


class SaleCreate(SaleBase):
    # We'll add sale_items separately (list of items)
    pass


class SaleUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[EmailStr] = None
    customer_phone: Optional[str] = None
    payment_method: Optional[str] = None


class SaleResponse(SaleBase):
    id: int
    invoice_number: str
    total_amount: float
    user_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# With sale items and user info
if TYPE_CHECKING:
    from .sale_item import SaleItemResponse
    from .user import UserResponse


class SaleWithDetails(SaleResponse):
    sale_items: List['SaleItemResponse'] = []
    user: Optional['UserResponse'] = None
    
    class Config:
        from_attributes = True

try:
    SaleWithDetails.model_rebuild()
    SaleResponse.model_rebuild()
except Exception:
    pass