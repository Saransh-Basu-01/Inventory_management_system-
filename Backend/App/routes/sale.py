from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from App.schemas import SaleTransactionCreate, SaleTransactionResponse
from App.schemas.sale import SaleWithDetails, SaleItemResponse
from App. curd.sale import create_sale_transaction, get_sales, get_sale
from App.database import get_db
from App.utils.dependencies import PaginationParams
from App.models.sale import Sale, SaleItem
from App.models.product import Product

from App.routes.auth import get_current_user, get_admin_user, get_manager_or_admin
from App.models.user import User

router = APIRouter()


def build_sale_response(sale: Sale, db: Session) -> dict:
    """Build sale response with items and product details"""
    sale_items = []
    
    for item in sale.sale_items:
        product = db.query(Product).filter(Product.id == item. product_id).first()
        sale_items.append({
            "id":  item.id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit_price": float(item.unit_price),
            "total_price": float(item.total_price),
            "product":  {
                "id":  product.id,
                "name": product.name,
                "sku": product. sku
            } if product else None
        })
    
    return {
        "id": sale. id,
        "invoice_number": sale.invoice_number,
        "customer_name": sale. customer_name,
        "customer_email": sale.customer_email,
        "customer_phone": sale.customer_phone,
        "payment_method": sale.payment_method,
        "total_amount":  float(sale.total_amount),
        "user_id": sale. user_id,
        "created_at": sale.created_at,
        "sale_items": sale_items
    }


@router.get("/sales", response_model=List[dict])
def api_list_sales(
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all sales with items"""
    sales = get_sales(db, skip=pagination.skip, limit=pagination. limit)
    return [build_sale_response(sale, db) for sale in sales]


@router.get("/sales/{sale_id}", response_model=dict)
def api_get_sale(
    sale_id:  int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single sale with items"""
    sale = get_sale(db, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return build_sale_response(sale, db)


@router.post("/sales", response_model=SaleTransactionResponse, status_code=201)
def api_create_sale(
    sale_in: SaleTransactionCreate,
    db: Session = Depends(get_db),
    manager:  User = Depends(get_manager_or_admin)
):
    """Create a new sale"""
    try:
        res = create_sale_transaction(db, sale_in, user_id=manager. id)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))