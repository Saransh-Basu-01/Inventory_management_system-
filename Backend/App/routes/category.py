from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from App. schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from App.curd import category as category_crud
from App.database import get_db
from App.utils. dependencies import PaginationParams

# Import auth functions
from App.routes.auth import get_current_user, get_admin_user, get_manager_or_admin
from App.models.user import User

router = APIRouter()


# VIEW - Any logged-in user
@router.get("/categories", response_model=List[CategoryResponse])
def api_list_categories(
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user:  User = Depends(get_current_user)
):
    return category_crud.get_categories(db, skip=pagination.skip, limit=pagination. limit)


@router.get("/categories/{category_id}", response_model=CategoryResponse)
def api_get_category(
    category_id:  int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cat = category_crud. get_category(db, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat


# CREATE & EDIT - Manager or Admin
@router.post("/categories", response_model=CategoryResponse, status_code=201)
def api_create_category(
    cat_in: CategoryCreate,
    db:  Session = Depends(get_db),
    manager: User = Depends(get_manager_or_admin)
):
    try:
        return category_crud.create_category(db, cat_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/categories/{category_id}", response_model=CategoryResponse)
def api_update_category(
    category_id: int,
    updates: CategoryUpdate,
    db: Session = Depends(get_db),
    manager: User = Depends(get_manager_or_admin)
):
    try:
        return category_crud.update_category(db, category_id, updates. dict(exclude_unset=True))
    except ValueError as e: 
        raise HTTPException(status_code=400, detail=str(e))


# DELETE - Admin only
@router.delete("/categories/{category_id}", status_code=204)
def api_delete_category(
    category_id:  int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    try:
        category_crud.delete_category(db, category_id)
    except ValueError as e: 
        raise HTTPException(status_code=404, detail=str(e))