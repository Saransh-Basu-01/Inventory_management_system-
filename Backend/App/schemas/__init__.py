"""
Schemas package for API request/response validation.
This file makes imports cleaner and centralizes all schema exports.
"""

# Product schemas
from .product import (
    ProductBase,
    ProductCreate, 
    ProductUpdate, 
    ProductResponse, 
    ProductWithSupplier
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
from .sale_transaction import (
    SaleTransactionCreate,
    SaleTransactionResponse,
    SaleItemInput
)

# Define what's available when someone does: from App.schemas import *
__all__ = [
    # Product
    "ProductBase",
    "ProductCreate",
    "ProductUpdate",
    "ProductResponse",
    "ProductWithSupplier",
    
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