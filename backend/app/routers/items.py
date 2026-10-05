import sqlite3
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from ..database import get_db
from ..schemas import (
    ShoppingItemCreate,
    ShoppingItemUpdate,
    ShoppingItemResponse,
    BudgetStatsResponse,
    ShareTextResponse
)
from .. import crud
from ..initial_data import MERCADONA_CATEGORIES

router = APIRouter(prefix="/items", tags=["Shopping Items"])

@router.get("", response_model=List[ShoppingItemResponse])
def read_items(
    list_id: Optional[str] = None,
    in_cart: Optional[bool] = None,
    category_id: Optional[str] = None,
    completed: Optional[bool] = None,
    search: Optional[str] = None,
    sort_by: str = "aisle",
    db: sqlite3.Connection = Depends(get_db)
):
    """Obtener productos con filtro por lista, estado en carrito, sección, búsqueda y ordenación por pasillo."""
    return crud.get_items(
        db,
        list_id=list_id,
        in_cart=in_cart,
        category_id=category_id,
        completed=completed,
        search=search,
        sort_by=sort_by
    )

@router.post("", response_model=ShoppingItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(item_in: ShoppingItemCreate, db: sqlite3.Connection = Depends(get_db)):
    """Añadir un nuevo producto a la lista seleccionada."""
    return crud.create_item(db, item_in)

@router.get("/stats", response_model=BudgetStatsResponse)
def get_stats(list_id: Optional[str] = None, db: sqlite3.Connection = Depends(get_db)):
    """Obtener resumen de presupuesto (en lista vs en carrito) y progreso."""
    return crud.calculate_stats(db, list_id=list_id)

@router.get("/share-text", response_model=ShareTextResponse)
def get_share_text(list_id: Optional[str] = None, db: sqlite3.Connection = Depends(get_db)):
    """Generar texto formateado para compartir por WhatsApp/Telegram con separación de Lista y Carrito."""
    items = crud.get_items(db, list_id=list_id, sort_by="aisle")
    stats = crud.calculate_stats(db, list_id=list_id)
    
    list_items = [i for i in items if not i.inCart]
    cart_items = [i for i in items if i.inCart]

    lines = ["🛒 *COMPRA MERCADONA* 🛒", ""]

    if list_items:
        lines.append("📋 *PENDIENTES EN LA LISTA:*")
        for item in list_items:
            price = f" (~{(item.estimatedPrice * item.quantity):.2f}€)" if item.estimatedPrice else ""
            note = f" _({item.notes})_" if item.notes else ""
            lines.append(f"⬜ {item.name} ({item.quantity:g} {item.unit}){price}{note}")
        lines.append("")

    if cart_items:
        lines.append("✅ *YA EN EL CARRITO:*")
        for item in cart_items:
            price = f" (~{(item.estimatedPrice * item.quantity):.2f}€)" if item.estimatedPrice else ""
            lines.append(f"🛒 {item.name} ({item.quantity:g} {item.unit}){price}")
        lines.append("")

    lines.append(f"💰 *Total en Carrito:* {stats.cartEstimated:.2f} €")
    lines.append(f"🧾 *Presupuesto Total Estimado:* {stats.totalEstimated:.2f} €")
    lines.append(f"📦 *En el Carro:* {stats.cartItemsCount}/{stats.totalItems} artículos ({stats.progressPercentage}%)")
    
    return ShareTextResponse(shareText="\n".join(lines))

@router.post("/reset-sample", response_model=List[ShoppingItemResponse])
def reset_sample(list_id: str = "default", db: sqlite3.Connection = Depends(get_db)):
    """Restaurar productos de ejemplo predefinidos de Mercadona en la lista."""
    crud.seed_sample_data(db, list_id=list_id)
    return crud.get_items(db, list_id=list_id, sort_by="aisle")

@router.delete("/completed", status_code=status.HTTP_200_OK)
def delete_completed(list_id: Optional[str] = None, db: sqlite3.Connection = Depends(get_db)):
    """Eliminar todos los productos comprados/en carrito."""
    count = crud.clear_completed(db, list_id=list_id)
    return {"deletedCount": count, "message": f"Se eliminaron {count} artículos completados"}

@router.delete("/all", status_code=status.HTTP_200_OK)
def delete_all(db: sqlite3.Connection = Depends(get_db)):
    """Vaciar toda la lista de la compra."""
    count = crud.clear_all(db)
    return {"deletedCount": count, "message": f"Lista vaciada ({count} artículos eliminados)"}

@router.get("/{item_id}", response_model=ShoppingItemResponse)
def read_item(item_id: str, db: sqlite3.Connection = Depends(get_db)):
    """Obtener un producto por su ID."""
    item = crud.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return item

@router.put("/{item_id}", response_model=ShoppingItemResponse)
def update_item(item_id: str, item_in: ShoppingItemUpdate, db: sqlite3.Connection = Depends(get_db)):
    """Actualizar datos de un producto (cantidad, precio, notas, lista, prioridad, etc.)."""
    updated = crud.update_item(db, item_id, item_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return updated

@router.patch("/{item_id}/toggle-cart", response_model=ShoppingItemResponse)
def toggle_cart(item_id: str, db: sqlite3.Connection = Depends(get_db)):
    """Mover producto de la lista al carrito o sacarlo del carrito a la lista."""
    toggled = crud.toggle_cart_item(db, item_id)
    if not toggled:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return toggled

@router.patch("/{item_id}/toggle", response_model=ShoppingItemResponse)
def toggle_item(item_id: str, db: sqlite3.Connection = Depends(get_db)):
    """Alternar estado comprado/en carrito."""
    return toggle_cart(item_id, db)

@router.delete("/{item_id}", status_code=status.HTTP_200_OK)
def delete_item(item_id: str, db: sqlite3.Connection = Depends(get_db)):
    """Eliminar un producto."""
    success = crud.delete_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"success": True, "id": item_id}
