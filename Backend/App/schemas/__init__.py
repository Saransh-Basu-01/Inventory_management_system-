"""
Schemas package for API request/response validation. 
"""

# Product schemas
from .product import (
    ProductBase,
    ProductCreate, 
    ProductUpdate, 
    ProductResponse,
)

# Supplier schemas
from .supplier import (
    SupplierBase,
    SupplierCreate, 
    SupplierUpdate, 
    SupplierResponse, 
    SupplierWithProducts
)

# Category schemas
from .category import (
    CategoryBase,
    CategoryCreate, 
    CategoryUpdate, 
    CategoryResponse
)

# User schemas
from .user import (
    UserBase,
    UserCreate, 
    UserUpdate, 
    UserResponse, 
    UserLogin,
    UserRole
)

# Auth schemas
from .auth import (
    Token,
    TokenData,
    LoginRequest,
    RegisterRequest,
    RefreshTokenRequest,
    PasswordChangeRequest,
    PasswordResetRequest,
    UserProfile
)

# Inventory Transaction schemas
from .inventory_transaction import (
    InventoryTransactionBase,
    InventoryTransactionCreate,
    InventoryTransactionUpdate,
    InventoryTransactionResponse,
    InventoryTransactionWithDetails,
    TransactionType
)

# Sale schemas
from .sale import (
    SaleBase,
    SaleCreate,
    SaleUpdate,
    SaleResponse,
    SaleWithDetails
)

# Sale Item schemas
from .sale_item import (
    SaleItemBase,
    SaleItemCreate,
    SaleItemUpdate,
    SaleItemResponse,
    SaleItemWithProduct
)

# Sale Transaction schemas
from . sale_transaction import (
    SaleTransactionCreate,
    SaleTransactionResponse,
    SaleItemInput
)

# Rebuild models for forward references
try:
    SaleItemResponse.model_rebuild()
    SaleItemWithProduct.model_rebuild()
    SaleWithDetails.model_rebuild()
    SaleResponse.model_rebuild()
except Exception: 
    pass

__all__ = [
    # Product
    "ProductBase",
    "ProductCreate",
    "ProductUpdate",
    "ProductResponse",
    
    # Supplier
    "SupplierBase",
    "SupplierCreate",
    "SupplierUpdate",
    "SupplierResponse",
    "SupplierWithProducts",
    
    # Category
    "CategoryBase",
    "CategoryCreate",
    "CategoryUpdate",
    "CategoryResponse",
    
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserLogin",
    "UserRole",
    
    # Auth
    "Token",
    "TokenData",
    "LoginRequest",
    "RegisterRequest",
    "RefreshTokenRequest",
    "PasswordChangeRequest",
    "PasswordResetRequest",
    "UserProfile",
    
    # Inventory Transaction
    "InventoryTransactionBase",
    "InventoryTransactionCreate",
    "InventoryTransactionUpdate",
    "InventoryTransactionResponse",
    "InventoryTransactionWithDetails",
    "TransactionType",
    
    # Sale
    "SaleBase",
    "SaleCreate",
    "SaleUpdate",
    "SaleResponse",
    "SaleWithDetails",
    
    # Sale Item
    "SaleItemBase",
    "SaleItemCreate",
    "SaleItemUpdate",
    "SaleItemResponse",
    "SaleItemWithProduct",
    
    # Sale Transaction
    "SaleTransactionCreate",
    "SaleTransactionResponse",
    "SaleItemInput",
]