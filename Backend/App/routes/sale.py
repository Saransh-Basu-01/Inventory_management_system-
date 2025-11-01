from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from App.schemas import SaleTransactionCreate, SaleTransactionResponse
from App.schemas import SaleWithDetails
from App.curd.sale import create_sale_transaction, get_sales, get_sale
from App.utils.dependencies import get_db, PaginationParams

router = APIRouter()

@router.post("/sales", response_model=SaleTransactionResponse, status_code=status.HTTP_201_CREATED)
def api_create_sale(sale_in: SaleTransactionCreate, db: Session = Depends(get_db)):
    try:
        res = create_sale_transaction(db, sale_in, user_id=None)
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/sales", response_model=List[SaleWithDetails], status_code=status.HTTP_200_OK)
def api_list_sales(pagination: PaginationParams = Depends(), db: Session = Depends(get_db)):
    sales = get_sales(db, skip=pagination.skip, limit=pagination.limit)
    return sales

@router.get("/sales/{sale_id}", response_model=SaleWithDetails, status_code=status.HTTP_200_OK)
def api_get_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = get_sale(db, sale_id)
    if not sale:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sale not found")
    return sale