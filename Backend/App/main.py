from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text 
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from App.database import init_db, test_connection
from App.utils.dependencies import get_db
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events.
    Runs on startup and shutdown.
    """
    # Startup
    print("=" * 60)
    print("🚀 Starting Inventory Management System...")
    print("=" * 60)
    
    # Test database connection
    if test_connection():
        # Initialize database (create tables if they don't exist)
        init_db()
    else:
        print("⚠️  Warning: Could not connect to database!")
    
    print("=" * 60)
    print("✅ Application started successfully!")
    print("📚 API Docs: http://127.0.0.1:8000/docs")
    print("=" * 60)
    
    yield  # Application runs here
    
    # Shutdown
    print("=" * 60)
    print("👋 Shutting down Inventory Management System...")
    print("=" * 60)

app = FastAPI(
    title="Inventory Management System API",
    description="A comprehensive inventory management system with product tracking, sales, and supplier management",
    version="1.0.0",
    lifespan=lifespan,
    debug=os.getenv("DEBUG", "False").lower() == "true"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    """
    Root endpoint - API information.
    """
    return {
        "message": "Inventory Management System API",
        "version": "1.0.0",
        "status": "running",
        "documentation": "/docs",
        "alternative_docs": "/redoc"
    }


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint - verify API and database status.
    """
    try:
        # Test database connection (SQLAlchemy 2.0 compatible)
        db.execute(text("SELECT 1"))  # ← Fixed: wrapped with text()
        
        return {
            "status": "healthy",
            "api": "running",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "api": "running",
            "database": "disconnected",
            "error": str(e)
        }


@app.get("/info")
def app_info():
    """
    Application information endpoint.
    """
    return {
        "app_name": "Inventory Management System",
        "version": "1.0.0",
        "author": "Saransh-Basu-01",
        "environment": "development" if os.getenv("DEBUG", "False").lower() == "true" else "production",
        "database_type": "SQLite" if os.getenv("DATABASE_URL", "").startswith("sqlite") else "SQL"
    }

if os.getenv("DEBUG", "False").lower() == "true":
    
    @app.get("/debug/tables")
    def list_tables():
        """
        Debug endpoint - list all database tables.
        ⚠️ Only available when DEBUG=True
        """
        from sqlalchemy import inspect
        from App.database import engine
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        return {
            "tables": tables,
            "count": len(tables)
        }
    
    
    @app.get("/debug/env")
    def show_env():
        """
        Debug endpoint - show environment configuration.
        ⚠️ Only available when DEBUG=True
        ⚠️ Sensitive values are hidden
        """
        return {
            "DATABASE_URL": "***hidden***" if os.getenv("DATABASE_URL") else None,
            "SECRET_KEY": "***hidden***" if os.getenv("SECRET_KEY") else None,
            "DEBUG": os.getenv("DEBUG"),
            "ACCESS_TOKEN_EXPIRE_MINUTES": os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
        }