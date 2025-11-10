# backend/App/curd/product.py

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from App.models import Product, Supplier, Category
from App.schemas.product import ProductCreate, ProductUpdate


def create_product(db: Session, product_in: ProductCreate) -> Product:
    """
    Create a Product row in the database.
    - Checks for existing SKU and raises ValueError if conflict.
    - Validates supplier and category existence.
    - Returns the created Product with relationships loaded.
    """
    # Validate supplier exists
    if product_in.supplier_id:
        supplier = db.query(Supplier).filter(Supplier.id == product_in.supplier_id).first()
        if not supplier:
            raise ValueError(f"Supplier with id={product_in.supplier_id} does not exist")
    
    # Validate category exists (if provided)
    if product_in.category_id:
        category = db.query(Category).filter(Category.id == product_in.category_id).first()
        if not category:
            raise ValueError(f"Category with id={product_in.category_id} does not exist")
    
    # Check duplicate SKU
    existing = db.query(Product).filter(Product.sku == product_in.sku).first()
    if existing:
        raise ValueError(f"Product with SKU '{product_in.sku}' already exists")
    
    # Create product
    db_product = Product(
        name=product_in.name,
        sku=product_in.sku,
        quantity=product_in.quantity,
        price=product_in.price,
        reorder_level=product_in.reorder_level,
        supplier_id=product_in.supplier_id,
        category_id=product_in.category_id
    )

    try:
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        
        # Load relationships
        if db_product.supplier_id:
            db_product.supplier = db.query(Supplier).filter(Supplier.id == db_product.supplier_id).first()
        if db_product.category_id:
            db_product.category = db.query(Category).filter(Category.id == db_product.category_id).first()
        
        return db_product
    except IntegrityError as e:
        db.rollback()
        raise ValueError("Database error while creating product") from e


def get_product(db: Session, product_id: int) -> Product | None:
    """Get a product by ID with relationships loaded."""
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if product:
        # Load relationships
        if product.supplier_id:
            product.supplier = db.query(Supplier).filter(Supplier.id == product.supplier_id).first()
        if product.category_id:
            product.category = db.query(Category).filter(Category.id == product.category_id).first()
    
    return product


def get_products(db: Session, skip: int = 0, limit: int = 100):
    """Get all products with relationships loaded."""
    products = db.query(Product).offset(skip).limit(limit).all()
    
    # Load relationships for each product
    for product in products:
        if product.supplier_id:
            product.supplier = db.query(Supplier).filter(Supplier.id == product.supplier_id).first()
        if product.category_id:
            product.category = db.query(Category).filter(Category.id == product.category_id).first()
    
    return products


def update_product(db: Session, product_id: int, updates: dict):
    """
    Update product fields (partial update).
    - Accepts a dict of fields to update
    - Validates SKU uniqueness and supplier/category existence
    - Returns updated product with relationships loaded
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError("Product not found")

    # Validate SKU uniqueness if being changed
    new_sku = updates.get("sku")
    if new_sku and new_sku != product.sku:
        existing = db.query(Product).filter(Product.sku == new_sku).first()
        if existing and existing.id != product_id:
            raise ValueError(f"Another product with SKU '{new_sku}' already exists")

    # Validate supplier exists if being changed
    if "supplier_id" in updates and updates["supplier_id"] is not None:
        supplier = db.query(Supplier).filter(Supplier.id == updates["supplier_id"]).first()
        if not supplier:
            raise ValueError(f"Supplier with id={updates['supplier_id']} does not exist")
    
    # Validate category exists if being changed
    if "category_id" in updates and updates["category_id"] is not None:
        category = db.query(Category).filter(Category.id == updates["category_id"]).first()
        if not category:
            raise ValueError(f"Category with id={updates['category_id']} does not exist")

    # Apply updates
    for field, value in updates.items():
        if hasattr(product, field):
            setattr(product, field, value)

    try:
        db.commit()
        db.refresh(product)
        
        # Load relationships
        if product.supplier_id:
            product.supplier = db.query(Supplier).filter(Supplier.id == product.supplier_id).first()
        if product.category_id:
            product.category = db.query(Category).filter(Category.id == product.category_id).first()
        
        return product
    except IntegrityError as e:
        db.rollback()
        raise ValueError("Database error while updating product") from e


def delete_product(db: Session, product_id: int):
    """
    Delete a product by ID.
    - Checks for related sales and transactions
    - Raises ValueError if product cannot be deleted
    """
    product = get_product(db, product_id)
    if not product:
        raise ValueError("Product not found")
    
    # Check if product has sales (optional - remove if you want to allow deletion)
    # from App.models import SaleItem
    # sale_items = db.query(SaleItem).filter(SaleItem.product_id == product_id).first()
    # if sale_items:
    #     raise ValueError("Cannot delete product that has been sold")
    
    # Check if product has inventory transactions (optional)
    # from App.models import InventoryTransaction
    # transactions = db.query(InventoryTransaction).filter(
    #     InventoryTransaction.product_id == product_id
    # ).first()
    # if transactions:
    #     raise ValueError("Cannot delete product with inventory transactions")
    
    try:
        db.delete(product)
        db.commit()
        return True
    except IntegrityError as e:
        db.rollback()
        raise ValueError("Cannot delete product due to foreign key constraints") from e