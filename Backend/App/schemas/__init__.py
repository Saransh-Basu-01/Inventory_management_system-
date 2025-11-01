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
try:
    SaleItemResponse.model_rebuild()
    SaleItemWithProduct.model_rebuild()
    SaleWithDetails.model_rebuild()
    SaleResponse.model_rebuild()
except Exception:
    # Ignore if already rebuilt or missing (fail-safe)
    pass

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

# # App/schemas/__init__.py
# # Import schema modules so all classes are defined at runtime (not only under TYPE_CHECKING)
# from .sale import SaleBase, SaleResponse, SaleWithDetails, SaleUpdate
# from .sale_item import SaleItemBase, SaleItemResponse, SaleItemWithProduct
# from .sale_transaction import SaleTransactionCreate, SaleTransactionResponse

# # If you have other cross-referenced schema modules, import them here as well:
# # from .product import ProductResponse
# # from .user import UserResponse

# # Rebuild Pydantic models so forward references are resolved (Pydantic v2)
# # Call model_rebuild() on any models that reference each other across modules.
# try:
#     SaleItemResponse.model_rebuild()
#     SaleItemWithProduct.model_rebuild()
#     SaleWithDetails.model_rebuild()
#     SaleResponse.model_rebuild()
# except Exception:
#     # If something is missing or already rebuilt, ignore
#     pass

# __all__ = [
#     "SaleBase",
#     "SaleResponse",
#     "SaleWithDetails",
#     "SaleItemBase",
#     "SaleItemResponse",
#     "SaleItemWithProduct",
#     "SaleTransactionCreate",
#     "SaleTransactionResponse",
# ]