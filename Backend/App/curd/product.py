from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from App.models import Product,Supplier
from App.schemas import ProductCreate,ProductUpdate

def create_product(db:Session,product_in:ProductCreate)->Product:
    """
    Create a Product row in the database.

    - Checks for existing SKU and raises ValueError if conflict.
    - Adds, commits, refreshes and returns the created Product SQLAlchemy model.
    """
    # Validate supplier if provided
    if product_in.supplier_id is not None:
        supplier = db.query(Supplier).filter(Supplier.id == product_in.supplier_id).first()
        if not supplier:
            raise ValueError(f"supplier_id={product_in.supplier_id} does not exist")
    
    # Pre-check duplicate SKU
    if getattr(product_in, "sku", None):
        existing = db.query(Product).filter(Product.sku == product_in.sku).first()
        if existing:
            raise ValueError(f"Product with sku='{product_in.sku}' already exists")

    existing=db.query(Product).filter(Product.sku==product_in.sku).first()
    if existing:
        raise ValueError(f"Product with sku='{product_in.sku}' already exists")
    
    db_product=Product(
        name=product_in.name,
        sku=product_in.sku,
        category=product_in.category,
        quantity=product_in.quantity,
        price=product_in.price,
        reorder_level=product_in.reorder_level,
        supplier_id=product_in.supplier_id
    )

    try:
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product
    except IntegrityError as e:
        db.rollback()
        # Re-raise as ValueError to let the route convert to HTTP error
        raise ValueError("Database integrity error while creating product") from e
        # print("DB error:", e, e.orig)   # inspect during dev
        # raise ValueError(str(e.orig) or str(e))
    
def get_product(db: Session, product_id: int) -> Product | None:
    """
    Get a product by ID. Returns the SQLAlchemy Product or None.
    """
    return db.query(Product).filter(Product.id == product_id).first()

def get_products(db:Session ,skip:int=0,limit:int=100):
    return db.query(Product).offset(skip).limit(limit).all()

def update_product(db: Session, product_id: int, product_in: ProductUpdate) -> Product:
    """
    Update product fields that are provided in product_in (partial update).
    - Ensures SKU uniqueness if provided.
    - Validates supplier_id if provided.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return None

    # Pydantic v2: get only fields that were provided by caller
    update_data = product_in.model_dump(exclude_unset=True)

    # If SKU is being changed, ensure uniqueness (and allow same product)
    new_sku = update_data.get("sku")
    if new_sku and new_sku != product.sku:
        existing = db.query(Product).filter(Product.sku == new_sku).first()
        if existing and existing.id != product_id:
            raise ValueError(f"Another product with sku='{new_sku}' already exists")

    # If supplier_id provided, validate it exists
    if "supplier_id" in update_data and update_data["supplier_id"] is not None:
        supplier = db.query(Supplier).filter(Supplier.id == update_data["supplier_id"]).first()
        if not supplier:
            raise ValueError(f"supplier_id={update_data['supplier_id']} does not exist")

    # Apply updates
    for field, value in update_data.items():
        setattr(product, field, value)

    try:
        db.add(product)
        db.commit()
        db.refresh(product)
        return product
    except IntegrityError as e:
        db.rollback()
        raise ValueError("Database integrity error while updating product: " + str(e))
    

def delete_product(db: Session, product_id: int) -> bool:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return False
    db.delete(product)
    db.commit()
    return True