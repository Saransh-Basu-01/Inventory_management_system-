"""
Models package for Inventory Management System.

This file centralizes all model imports, making it easier to:
- Import models from one place
- Ensure all models are registered with SQLAlchemy Base
- Keep database.py and main.py clean
"""

# Import all models
from .product import Product
from .supplier import Supplier
from .category import Category
from .user import User
from .inventory_transaction import InventoryTransaction
from .sale import Sale, SaleItem

# Export all models
__all__ = [
    "Product",
    "Supplier", 
    "Category",
    "User",
    "InventoryTransaction",
    "Sale",
    "SaleItem"
]