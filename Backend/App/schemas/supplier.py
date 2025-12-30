from pydantic import BaseModel, Field, EmailStr,field_validator
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
import re 

class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    contact_person: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr]  # Validates email format
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=255)
    @field_validator('phone')
    @classmethod
    def validate_nepali_phone(cls, v):
        if v is None or v == "":
            return v
        
        # Remove spaces, dashes, parentheses
        cleaned = re.sub(r'[\s\-\(\)\.]', '', v)
        
        # Remove +977 prefix if present
        if cleaned.startswith('+977'):
            cleaned = cleaned[4:]
        elif cleaned.startswith('977'):
            cleaned = cleaned[3:]
        
        # Must be exactly 10 digits
        if not re.match(r'^\d{10}$', cleaned):
            raise ValueError('Phone must be exactly 10 digits')
        
        # Must start with 98 or 97 (Nepali mobile)
        if not cleaned. startswith(('98', '97')):
            raise ValueError('Nepali mobile number must start with 98 or 97')
        
        return cleaned 

class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    @field_validator('phone')
    @classmethod
    def validate_nepali_phone(cls, v):
        if v is None or v == "":
            return v
        
        # Remove spaces, dashes, parentheses
        cleaned = re.sub(r'[\s\-\(\)\.]', '', v)
        
        # Remove +977 prefix if present
        if cleaned.startswith('+977'):
            cleaned = cleaned[4:]
        elif cleaned.startswith('977'):
            cleaned = cleaned[3:]
        
        # Must be exactly 10 digits
        if not re.match(r'^\d{10}$', cleaned):
            raise ValueError('Phone must be exactly 10 digits')
        
        # Must start with 98 or 97 (Nepali mobile)
        if not cleaned. startswith(('98', '97')):
            raise ValueError('Nepali mobile number must start with 98 or 97')
        
        return cleaned 


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