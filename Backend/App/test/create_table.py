from App.database import Base, engine
from App.models.product import Product

print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("✅ Tables created successfully!")
