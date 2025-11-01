from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from App.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from App.curd import category as category_crud
from App.utils.dependencies import get_db, PaginationParams

router = APIRouter()

@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def api_create_category(cat_in: CategoryCreate, db: Session = Depends(get_db)):
    try:
        return category_crud.create_category(db, cat_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/categories", response_model=List[CategoryResponse])
def api_list_categories(pagination: PaginationParams = Depends(), db: Session = Depends(get_db)):
    return category_crud.get_categories(db, skip=pagination.skip, limit=pagination.limit)

@router.get("/categories/{category_id}", response_model=CategoryResponse)
def api_get_category(category_id: int, db: Session = Depends(get_db)):
    cat = category_crud.get_category(db, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat

@router.patch("/categories/{category_id}", response_model=CategoryResponse)
def api_update_category(category_id: int, updates: CategoryUpdate, db: Session = Depends(get_db)):
    try:
        return category_crud.update_category(db, category_id, updates.dict(exclude_unset=True))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def api_delete_category(category_id: int, db: Session = Depends(get_db)):
    try:
        category_crud.delete_category(db, category_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))