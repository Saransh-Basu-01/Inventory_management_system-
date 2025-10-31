from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from App.schemas import InventoryTransactionCreate, InventoryTransactionResponse
from App.curd.inventory_transaction import (
    create_inventory_transaction, get_inventory_transactions, get_inventory_transaction
)
from App.utils.dependencies import get_db, PaginationParams

router = APIRouter()

@router.post("/inventory-transactions", response_model=InventoryTransactionResponse, status_code=status.HTTP_201_CREATED)
def api_create_inventory_transaction(tx_in: InventoryTransactionCreate, db: Session = Depends(get_db)):
    try:
        tx = create_inventory_transaction(db, tx_in)
        return tx
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/inventory-transactions", response_model=List[InventoryTransactionResponse])
def api_list_inventory_transactions(pagination: PaginationParams = Depends(), db: Session = Depends(get_db)):
    return get_inventory_transactions(db, skip=pagination.skip, limit=pagination.limit)

@router.get("/inventory-transactions/{tx_id}", response_model=InventoryTransactionResponse)
def api_get_inventory_transaction(tx_id: int, db: Session = Depends(get_db)):
    tx = get_inventory_transaction(db, tx_id)
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return tx