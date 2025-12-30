from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from App.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from App.curd.product import (
    create_product, get_product, get_products,
    update_product, delete_product
)
from App.database import get_db
from App.utils.dependencies import PaginationParams

# Import auth functions
from App. routes.auth import get_current_user, get_admin_user, get_manager_or_admin
from App.models.user import User

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════
# VIEW - Anyone logged in can view
# ═══════════════════════════════════════════════════════════════════

@router. get("/products", response_model=List[ProductResponse])
def api_list_products(
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Any logged-in user
):
    """List all products (All roles)"""
    products = get_products(db, skip=pagination.skip, limit=pagination. limit)
    return products


@router. get("/products/{product_id}", response_model=ProductResponse)
def api_get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Any logged-in user
):
    """Get product by ID (All roles)"""
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ═══════════════════════════════════════════════════════════════════
# CREATE & EDIT - Manager or Admin only
# ═══════════════════════════════════════════════════════════════════

@router. post("/products", response_model=ProductResponse, status_code=201)
def api_create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    manager: User = Depends(get_manager_or_admin)  # Manager or Admin only! 
):
    """Create a product (Manager/Admin only)"""
    try:
        product = create_product(db, product_in)
        return product
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/products/{product_id}", response_model=ProductResponse)
def api_update_product(
    product_id: int,
    product:  ProductUpdate,
    db: Session = Depends(get_db),
    manager: User = Depends(get_manager_or_admin)  # Manager or Admin only! 
):
    """Update a product (Manager/Admin only)"""
    try: 
        from App.curd import product as product_crud
        updates = product. model_dump(exclude_unset=True)
        updated_product = product_crud.update_product(db, product_id, updates)

        if not updated_product: 
            raise HTTPException(status_code=404, detail="Product not found")

        return updated_product
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ═══════════════════════════════════════════════════════════════════
# DELETE - Admin only
# ═══════════════════════════════════════════════════════════════════

@router.delete("/products/{product_id}", status_code=204)
def api_delete_product(
    product_id:  int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)  # Admin only!
):
    """Delete a product (Admin only)"""
    deleted = delete_product(db, product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Product not found")
    return None