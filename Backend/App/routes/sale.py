from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from App.schemas import SaleTransactionCreate, SaleTransactionResponse
from App.schemas import SaleWithDetails
from App.curd.sale import create_sale_transaction, get_sales, get_sale
from App.database import get_db
from App.utils.dependencies import PaginationParams

# Import auth functions
from App.routes.auth import get_current_user, get_admin_user, get_manager_or_admin
from App.models.user import User

router = APIRouter()


# VIEW - Any logged-in user
@router. get("/sales", response_model=List[SaleWithDetails])
def api_list_sales(
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_sales(db, skip=pagination. skip, limit=pagination.limit)


@router.get("/sales/{sale_id}", response_model=SaleWithDetails)
def api_get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sale = get_sale(db, sale_id)
    if not sale: 
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale


# CREATE - Manager or Admin
@router.post("/sales", response_model=SaleTransactionResponse, status_code=201)
def api_create_sale(
    sale_in: SaleTransactionCreate,
    db: Session = Depends(get_db),
    manager: User = Depends(get_manager_or_admin)
):
    try:
        res = create_sale_transaction(db, sale_in, user_id=manager.id)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))