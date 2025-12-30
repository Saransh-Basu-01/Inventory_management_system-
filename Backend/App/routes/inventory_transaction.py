from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from App.schemas import InventoryTransactionCreate, InventoryTransactionResponse
from App.curd.inventory_transaction import (
    create_inventory_transaction, get_inventory_transactions, get_inventory_transaction
)
from App.database import get_db
from App.utils.dependencies import PaginationParams

# Import auth functions
from App.routes.auth import get_current_user, get_admin_user, get_manager_or_admin
from App.models. user import User

router = APIRouter()


# VIEW - Any logged-in user
@router.get("/inventory-transactions", response_model=List[InventoryTransactionResponse])
def api_list_inventory_transactions(
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_inventory_transactions(db, skip=pagination.skip, limit=pagination. limit)


@router.get("/inventory-transactions/{tx_id}", response_model=InventoryTransactionResponse)
def api_get_inventory_transaction(
    tx_id:  int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = get_inventory_transaction(db, tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


# CREATE - Manager or Admin (inventory changes are important!)
@router.post("/inventory-transactions", response_model=InventoryTransactionResponse, status_code=201)
def api_create_inventory_transaction(
    tx_in: InventoryTransactionCreate,
    db:  Session = Depends(get_db),
    manager: User = Depends(get_manager_or_admin)
):
    try:
        tx = create_inventory_transaction(db, tx_in)
        return tx
    except ValueError as e: 
        raise HTTPException(status_code=400, detail=str(e))