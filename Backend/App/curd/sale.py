from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from App.models import Sale, SaleItem, Product
from App.schemas import SaleTransactionCreate
from App.schemas import SaleResponse, SaleWithDetails

def _generate_invoice_number(db: Session) -> str:
    # Simple invoice generator — timestamp + count to reduce collisions
    cnt = db.query(Sale).count() or 0
    return f"INV-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{cnt+1}"

def create_sale_transaction(db: Session, sale_in: SaleTransactionCreate, user_id: Optional[int] = None) -> Dict:
    """
    Create a Sale and SaleItems, validate stock, deduct product quantities atomically.
    Returns a dict compatible with SaleTransactionResponse.
    Raises ValueError for validation issues.
    """
    if not sale_in.items:
        raise ValueError("Sale must include at least one item")

    # Collect product ids and load products in-session (with_for_update where supported)
    product_ids = list({item.product_id for item in sale_in.items})
    products_q = db.query(Product).filter(Product.id.in_(product_ids))

    # Try to lock rows for update when DB supports it
    try:
        products = {p.id: p for p in products_q.with_for_update().all()}
    except Exception:
        # Some DBs (SQLite) don't support FOR UPDATE in the same way; fallback to simple load
        products = {p.id: p for p in products_q.all()}

    # Validate products exist
    for pid in product_ids:
        if pid not in products:
            raise ValueError(f"product_id={pid} does not exist")

    # Prepare line items and validate stock
    total_amount = 0.0
    total_items = 0
    prepared_lines = []
    for item in sale_in.items:
        prod = products[item.product_id]
        unit_price = item.unit_price if item.unit_price is not None else float(getattr(prod, "price", 0.0))
        if unit_price is None:
            raise ValueError(f"No unit_price provided and product {prod.id} has no price")

        if (prod.quantity or 0) < item.quantity:
            raise ValueError(f"Not enough stock for product_id={prod.id}")

        line_total = unit_price * item.quantity
        total_amount += line_total
        total_items += item.quantity
        prepared_lines.append({
            "product": prod,
            "product_id": prod.id,
            "quantity": item.quantity,
            "unit_price": unit_price,
            "total_price": line_total
        })

    # Create Sale and SaleItem rows atomically
    sale_obj = Sale(
        invoice_number=_generate_invoice_number(db),
        customer_name=sale_in.customer_name,
        customer_email=sale_in.customer_email,
        customer_phone=sale_in.customer_phone,
        payment_method=sale_in.payment_method,
        total_amount=total_amount,
        user_id=user_id,
        created_at=datetime.utcnow()
    )

    try:
        db.add(sale_obj)
        db.flush()  # assign id

        # Create sale items and deduct stock
        for li in prepared_lines:
            prod = li["product"]
            si = SaleItem(
                sale_id=sale_obj.id,
                product_id=li["product_id"],
                quantity=li["quantity"],
                unit_price=li["unit_price"],
                total_price=li["total_price"]
            )
            prod.quantity = (prod.quantity or 0) - li["quantity"]
            if prod.quantity < 0:
                raise ValueError(f"Not enough stock after deduction for product_id={prod.id}")

            db.add(si)
            db.add(prod)

        db.commit()
        db.refresh(sale_obj)

        # Build response dict compatible with SaleTransactionResponse
        return {
            "sale_id": sale_obj.id,
            "invoice_number": sale_obj.invoice_number,
            "total_amount": sale_obj.total_amount,
            "total_items": total_items,
            "customer_name": sale_obj.customer_name,
            "created_at": sale_obj.created_at.isoformat(),
            "message": "Sale created successfully"
        }
    except IntegrityError as e:
        db.rollback()
        detail = None
        try:
            detail = str(e.orig)
        except Exception:
            detail = "; ".join(map(str, e.args)) if e.args else "Integrity error"
        raise ValueError("Database error while creating sale: " + detail)
    except Exception:
        db.rollback()
        raise ValueError("Sale must include at least one item")
    
def get_sale(db: Session, sale_id: int) -> Optional[Sale]:
    return db.query(Sale).filter(Sale.id == sale_id).first()

def get_sales(db: Session, skip: int = 0, limit: int = 100) -> List[Sale]:
    return db.query(Sale).order_by(Sale.created_at.desc()).offset(skip).limit(limit).all()