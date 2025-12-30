from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from App.schemas import SupplierCreate, SupplierResponse, SupplierUpdate
from App. curd. supplier import (
    Create_supplier, get_supplier, get_suppliers, delete_supplier, update_supplier
)
from App.database import get_db
from App.utils. dependencies import PaginationParams

# Import auth functions
from App.routes.auth import get_current_user, get_admin_user, get_manager_or_admin
from App.models.user import User

router = APIRouter()


# VIEW - Any logged-in user
@router.get("/suppliers", response_model=List[SupplierResponse])
def api_list_suppliers(
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_suppliers(db, skip=pagination.skip, limit=pagination. limit)


@router.get("/suppliers/{supplier_id}", response_model=SupplierResponse)
def api_get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supplier = get_supplier(db, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


# CREATE & EDIT - Manager or Admin
@router.post("/suppliers", response_model=SupplierResponse, status_code=201)
def api_create_supplier(
    supplier_in: SupplierCreate,
    db: Session = Depends(get_db),
    manager: User = Depends(get_manager_or_admin)
):
    try:
        return Create_supplier(db, supplier_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/suppliers/{supplier_id}", response_model=SupplierResponse)
def api_update_supplier(
    supplier_id: int,
    supplier_in: SupplierUpdate,
    db: Session = Depends(get_db),
    manager: User = Depends(get_manager_or_admin)
):
    try:
        supplier = update_supplier(db, supplier_id, supplier_in)
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return supplier
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# DELETE - Admin only
@router.delete("/suppliers/{supplier_id}", status_code=204)
def api_delete_supplier(
    supplier_id:  int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    try:
        deleted = delete_supplier(db, supplier_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return None
    except ValueError as e: 
        raise HTTPException(status_code=400, detail=str(e))