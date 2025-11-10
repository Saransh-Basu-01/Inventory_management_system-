from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from App.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from App.curd.product import (
    create_product, get_product, get_products,
    update_product, delete_product
)
from App.utils.dependencies import get_db, PaginationParams
from App.curd import product as product_crud
router=APIRouter()
@router.post(
    "/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a product"
)
def api_create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    """
    Create a new product.

    - Validates input via ProductCreate
    - Returns created product (ProductResponse)
    """
    try:
        product = create_product(db, product_in)
        return product
    except ValueError as e:
        # Convert business error to HTTP 400
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.get(
    "/products/{product_id}",
    response_model=ProductResponse,
    status_code=status.HTTP_200_OK,
    summary="Get product by id"
)
def api_get_product(product_id: int, db: Session = Depends(get_db)):
    """
    Retrieve product by ID for quick verification/testing.
    """
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product

@router.get(
    "/products",
    response_model=List[ProductResponse],
    status_code=status.HTTP_200_OK,
    summary="List products"
)
def api_list_products(pagination: PaginationParams = Depends(), db: Session = Depends(get_db)):
    products = get_products(db, skip=pagination.skip, limit=pagination.limit)
    return products

@router.patch("/products/{product_id}", response_model=ProductResponse)
def api_update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    try:
        # Convert to dict first
        updates = product.model_dump(exclude_unset=True)
        updated_product = product_crud.update_product(db, product_id, updates)
        #                                                              ↑ CORRECT
        
        if not updated_product:
            raise HTTPException(status_code=404, detail="Product not found")
            
        return updated_product
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
@router.delete(
    "/products/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a product"
)
def api_delete_product(product_id: int, db: Session = Depends(get_db)):
    deleted = delete_product(db, product_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return None