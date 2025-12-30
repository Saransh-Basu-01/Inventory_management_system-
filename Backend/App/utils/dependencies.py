from typing import Generator, Optional
from sqlalchemy. orm import Session

# ✅ Import directly from database module using relative path
# DON'T import from App.database - that causes circular import
from sqlalchemy. orm import sessionmaker
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator: 
    """Database session generator"""
    db = SessionLocal()
    try:
        yield db
    finally: 
        db.close()


class PaginationParams:
    def __init__(self, skip: int = 0, limit: int = 100):
        self.skip = max(0, skip)
        self.limit = min(limit, 100)