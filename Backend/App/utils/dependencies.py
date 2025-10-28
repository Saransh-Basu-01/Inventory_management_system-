from typing import Generator, Optional
from sqlalchemy.orm import Session
from App.database import get_db as get_database_session
get_db = get_database_session

class PaginationParams:
    """
    Reusable pagination parameters for list endpoints.
    
    Usage:
        @app.get("/products")
        def get_products(
            pagination: PaginationParams = Depends(),
            db: Session = Depends(get_db)
        ):
            products = db.query(Product)\
                .offset(pagination.skip)\
                .limit(pagination.limit)\
                .all()
            return products
    
    Query parameters:
        skip: Number of records to skip (default: 0)
        limit: Maximum records to return (default: 100, max: 100)
    """
    def __init__(
        self,
        skip: int = 0,
        limit: int = 100
    ):
        self.skip = max(0, skip)  # Ensure skip is not negative
        self.limit = min(limit, 100)  # Cap at 100 items max

class CommonQueryParams:
    """
    Common query parameters for filtering, sorting, and pagination.
    
    Usage:
        @app.get("/products")
        def get_products(
            commons: CommonQueryParams = Depends(),
            db: Session = Depends(get_db)
        ):
            query = db.query(Product)
            
            # Apply search filter
            if commons.search:
                query = query.filter(Product.name.contains(commons.search))
            
            # Apply sorting
            if commons.sort_by:
                column = getattr(Product, commons.sort_by, None)
                if column:
                    if commons.order == "desc":
                        query = query.order_by(column.desc())
                    else:
                        query = query.order_by(column)
            
            # Apply pagination
            return query.offset(commons.skip).limit(commons.limit).all()
    
    Query parameters:
        skip: Number of records to skip (default: 0)
        limit: Maximum records to return (default: 100, max: 100)
        search: Search term to filter results (optional)
        sort_by: Field name to sort by (optional)
        order: Sort order - "asc" or "desc" (default: "asc")
    """
    def __init__(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        sort_by: Optional[str] = None,
        order: str = "asc"
    ):
        self.skip = max(0, skip)
        self.limit = min(limit, 100)
        self.search = search
        self.sort_by = sort_by
        self.order = order.lower() if order.lower() in ["asc", "desc"] else "asc"

__all__ = [
    "get_db",
    "PaginationParams",
    "CommonQueryParams"
]