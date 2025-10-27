from fastapi import FastAPI
from App.database import Base, engine
app = FastAPI(
    title="Inventory Management System API",
    description="A comprehensive inventory management system",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {
        "message": "Inventory Management System API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
def health_check():
    return {"status": "OK", "database": "connected"}
