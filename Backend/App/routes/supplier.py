from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from App.schemas import SupplierCreate,SupplierResponse,SupplierUpdate
from App.curd.supplier import (
  Create_supplier,get_supplier,get_suppliers,delete_supplier,update_supplier
)
from App.utils.dependencies import get_db, PaginationParams
router=APIRouter()

@router.post("/suppliers",response_model=SupplierResponse,status_code=201)
def api_create_supplier(supplier_in:SupplierCreate,db:Session=Depends(get_db)):
    try:
        supplier=Create_supplier(db,supplier_in)
        return supplier
    except ValueError as e:
        # Convert business error to HTTP 400
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.get("/suppliers/{supplier_id}",
           response_model=SupplierResponse,
            status_code=status.HTTP_200_OK,
            summary="Get supplier by id" )
def api_get_supplier(supplier_id:int,db:Session=Depends(get_db)):
    supplier=get_supplier(db,supplier_id)
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return supplier

@router.get(
    "/suppliers",
    response_model=List[SupplierResponse],
    status_code=status.HTTP_200_OK,
    summary="List suppliers"
)
def api_list_products(pagination: PaginationParams = Depends(), db: Session = Depends(get_db)):
    products = get_suppliers(db, skip=pagination.skip, limit=pagination.limit)
    return products


@router.patch("/suppliers/{supplier_id}", response_model=SupplierResponse)
def api_update_supplier(supplier_id: int, supplier_in: SupplierUpdate, db: Session = Depends(get_db)):
    try:
        supplier = update_supplier(db, supplier_id, supplier_in)
        if not supplier:
            raise HTTPException(404, "Supplier not found")
        return supplier
    except ValueError as e:
        raise HTTPException(400, str(e))

@router.delete("/suppliers/{supplier_id}", status_code=204)
def api_delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    try:
        deleted = delete_supplier(db, supplier_id)
        if not deleted:
            raise HTTPException(404, "Supplier not found")
        return None
    except ValueError as e:
        raise HTTPException(400, str(e))
