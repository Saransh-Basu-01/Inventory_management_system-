# from sqlalchemy.exc import IntegrityError
# from sqlalchemy.orm import Session
# from typing  import Optional,List
# from App.models import InventoryTransaction,Product
# from App.schemas import InventoryTransactionCreate,InventoryTransactionResponse
# from datetime import datetime 

# def create_inventory_transaction(db:Session,tx_in:InventoryTransactionCreate)->InventoryTransaction:
#     product=db.query(Product).filter(Product.id==tx_in.product_id).first()
#     if not product:
#         raise ValueError(f"product_id={tx_in.product_id} doesnot exist")
    
#     unit_price = tx_in.unit_price if tx_in.unit_price is not None else getattr(product, "price", None)
#     if unit_price is None:
#         raise ValueError("unit_price must be provided or product must have a price")
    
#     total_price=tx_in.total_price if tx_in.total_price is not None else unit_price * tx_in.quantity


#     if tx_in.transaction_type =='stock_in':
#         product.quantity=(product.quantity or 0) +tx_in.quantity
#     elif tx_in.transaction_type == "stock_out":
#         if (product.quantity or 0) < tx_in.quantity:
#             raise ValueError("Not enough stock for this transaction")
#         product.quantity = product.quantity - tx_in.quantity
#     else:
#         # handle 'adjustment' and 'return' accordingly (example: adjustment can be +/-)
#         # For adjustment: product.quantity += tx_in.quantity  # allow negative tx_in.quantity
#         product.quantity = (product.quantity or 0) + tx_in.quantity

#     try:
#         db_tx=InventoryTransaction(
#             product_id=tx_in.product_id,
#             transaction_type=tx_in.transaction_type,
#             quantity=tx_in.quantity,
#             unit_price=unit_price,
#             total_price=total_price,
#             reference_number=tx_in.reference_number,
#             notes=tx_in.notes,
#             created_at=datetime.utcnow()
#         )
#         db.add(db_tx)
#         # product is already modified in-session; ensure persistence
#         db.add(product)
#         db.commit()
#         db.refresh(db_tx)
#         return db_tx
#     except IntegrityError as e:
#         db.rollback()
#         raise ValueError("Database error while creating transaction: " + str(e))
    
# def get_inventory_transaction(db: Session, tx_id: int) -> Optional[InventoryTransaction]:
#         return db.query(InventoryTransaction).filter(InventoryTransaction.id == tx_id).first()

# def get_inventory_transactions(db: Session, skip: int = 0, limit: int = 100):
#         return db.query(InventoryTransaction).offset(skip).limit(limit).all()

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from typing import Optional, List
from App.models import InventoryTransaction, Product
from App.schemas import InventoryTransactionCreate, InventoryTransactionResponse
from datetime import datetime

def create_inventory_transaction(db: Session, tx_in: InventoryTransactionCreate) -> InventoryTransaction:
    product = db.query(Product).filter(Product.id == tx_in.product_id).first()
    if not product:
        raise ValueError(f"product_id={tx_in.product_id} does not exist")

    unit_price = tx_in.unit_price if tx_in.unit_price is not None else getattr(product, "price", None)
    if unit_price is None:
        raise ValueError("unit_price must be provided or product must have a price")

    total_price = tx_in.total_price if tx_in.total_price is not None else unit_price * tx_in.quantity

    if tx_in.transaction_type == 'stock_in':
        product.quantity = (product.quantity or 0) + tx_in.quantity
    elif tx_in.transaction_type == "stock_out":
        if (product.quantity or 0) < tx_in.quantity:
            raise ValueError("Not enough stock for this transaction")
        product.quantity = product.quantity - tx_in.quantity
    else:
        # adjustment and return: adjust by signed quantity
        product.quantity = (product.quantity or 0) + tx_in.quantity

    try:
        db_tx = InventoryTransaction(
            product_id=tx_in.product_id,
            transaction_type=tx_in.transaction_type,
            quantity=tx_in.quantity,
            unit_price=unit_price,
            total_price=total_price,
            reference_number=tx_in.reference_number,
            notes=tx_in.notes,
            created_at=datetime.utcnow()
        )
        db.add(db_tx)
        db.add(product)
        db.commit()
        db.refresh(db_tx)
        return db_tx
    except IntegrityError as e:
        db.rollback()
        raise ValueError("Database error while creating transaction: " + str(e))


def get_inventory_transaction(db: Session, tx_id: int) -> Optional[InventoryTransaction]:
    return db.query(InventoryTransaction).filter(InventoryTransaction.id == tx_id).first()


def get_inventory_transactions(db: Session, skip: int = 0, limit: int = 100) -> List[InventoryTransaction]:
    """
    Return inventory transactions but filter out rows that have product_id IS NULL to avoid
    ResponseValidationError on the API layer. This is a defensive measure while cleaning DB.
    """
    return (
        db.query(InventoryTransaction)
        .filter(InventoryTransaction.product_id != None)
        .offset(skip)
        .limit(limit)
        .all()
    )


# Helper: find invalid rows (product_id IS NULL)
def get_invalid_inventory_transactions(db: Session, skip: int = 0, limit: int = 100) -> List[InventoryTransaction]:
    return (
        db.query(InventoryTransaction)
        .filter(InventoryTransaction.product_id == None)
        .offset(skip)
        .limit(limit)
        .all()
    )


# Helper: delete invalid rows (product_id IS NULL)
def delete_invalid_inventory_transactions(db: Session) -> int:
    """
    Delete rows with product_id IS NULL. Returns number of rows deleted.
    Use with caution; prefer running the dry-run script first.
    """
    deleted = db.query(InventoryTransaction).filter(InventoryTransaction.product_id == None).delete(synchronize_session=False)
    db.commit()
    return deleted