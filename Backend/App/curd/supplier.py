from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from App.models import Supplier
from App.schemas import SupplierCreate,SupplierUpdate,SupplierResponse,SupplierWithProducts
from typing import List, Optional

def Create_supplier(db:Session,supplier_in:SupplierCreate)->Supplier:
    """
    Create a new supplier.
    - Prevents duplicate supplier by email.
    - Commits and returns the SQLAlchemy Supplier instance.
    """

    existing=db.query(Supplier).filter(Supplier.email==supplier_in.email).first()
    if existing:
        raise ValueError(f"Supplier with this email='{supplier_in.email}' already exists")
    
    db_supplier=Supplier(
        name = supplier_in.name,
        contact_person =supplier_in.contact_person,
        email = supplier_in.email,
        phone = supplier_in.phone,
        address = supplier_in.address
        )
    try:
        db.add(db_supplier)
        db.commit()
        db.refresh(db_supplier)
        return db_supplier
    except IntegrityError as e:
        db.rollback()
        # Provide clearer error text for dev; route will convert to HTTP 400
        detail = None
        try:
            detail = str(e.orig)
        except Exception:
            detail = "; ".join(map(str, e.args)) if e.args else "Integrity error"
        raise ValueError("Database integrity error while creating supplier: " + detail)
    
def get_supplier(db:Session,supplier_id:int)->Optional[Supplier]:
    return db.query(Supplier).filter(Supplier.id==supplier_id).first()

def get_suppliers(db:Session ,skip:int=0,limit:int=100)->List[Supplier]:
    return db.query(Supplier).offset(skip).limit(limit).all()

def update_supplier(db: Session, supplier_id: int, supplier_in: SupplierUpdate) -> Optional[Supplier]:
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        return None
    update_data = supplier_in.model_dump(exclude_unset=True)
     # If email is being changed, check uniqueness
    if "email" in update_data:
        new_email = update_data["email"]
        existing = db.query(Supplier).filter(Supplier.email == new_email).first()
        if existing and existing.id != supplier_id:
            raise ValueError(f"Another supplier with email '{new_email}' already exists")
        
    for field, value in update_data.items():
        setattr(supplier, field, value)
    try:
        db.add(supplier)
        db.commit()
        db.refresh(supplier)
        return supplier
    except IntegrityError as e:
        db.rollback()
        raise ValueError("Database error: " + str(e))
    
def delete_supplier(db: Session, supplier_id: int) -> bool:
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        return False
    try:
        db.delete(supplier)
        db.commit()
        return True
    except IntegrityError as e:
        db.rollback()
        # Common case: FK constraints (products referencing supplier)
        detail = None
        try:
            detail = str(e.orig)
        except Exception:
            detail = "; ".join(map(str, e.args)) if e.args else "Integrity error"
        raise ValueError("Cannot delete supplier: there are references to this supplier. " + detail)
    
