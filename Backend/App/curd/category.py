from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from App.models import Category
from App.schemas import CategoryCreate

def create_category(db: Session, cat_in: CategoryCreate) -> Category:
    cat = Category(name=cat_in.name, description=cat_in.description)
    try:
        db.add(cat)
        db.commit()
        db.refresh(cat)
        return cat
    except IntegrityError as e:
        db.rollback()
        raise ValueError(f"Category with name '{cat_in.name}' already exists")

def get_category(db: Session, category_id: int) -> Optional[Category]:
    return db.query(Category).filter(Category.id == category_id).first()

def get_categories(db: Session, skip: int = 0, limit: int = 100) -> List[Category]:
    return db.query(Category).order_by(Category.name).offset(skip).limit(limit).all()

def update_category(db: Session, category_id: int, updates: dict) -> Category:
    cat = get_category(db, category_id)
    if not cat:
        raise ValueError("Category not found")
    for k, v in updates.items():
        setattr(cat, k, v)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

def delete_category(db: Session, category_id: int) -> None:
    cat = get_category(db, category_id)
    if not cat:
        raise ValueError("Category not found")
    # Optionally check related products before delete
    db.delete(cat)
    db.commit()