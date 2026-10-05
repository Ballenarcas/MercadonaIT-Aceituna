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
    category_id: Optional[str] = None,
    completed: Optional[bool] = None,
    search: Optional[str] = None,
    sort_by: str = "aisle",
    db: sqlite3.Connection = Depends(get_db)
):
    """Obtener lista de compras con soporte para filtros de categoría, estado, búsqueda y ordenación por pasillo."""
    return crud.get_items(db, category_id=category_id, completed=completed, search=search, sort_by=sort_by)

@router.post("", response_model=ShoppingItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(item_in: ShoppingItemCreate, db: sqlite3.Connection = Depends(get_db)):
    """Añadir un nuevo producto a la lista."""
    return crud.create_item(db, item_in)

@router.get("/stats", response_model=BudgetStatsResponse)
def get_stats(db: sqlite3.Connection = Depends(get_db)):
    """Obtener resumen de presupuesto, cantidades y porcentaje de progreso."""
    return crud.calculate_stats(db)

@router.get("/share-text", response_model=ShareTextResponse)
def get_share_text(db: sqlite3.Connection = Depends(get_db)):
    """Generar texto formateado para compartir por WhatsApp/Telegram."""
    items = crud.get_items(db, sort_by="aisle")
    stats = crud.calculate_stats(db)
    
    grouped = {}
    for item in items:
        cat_id = item.categoryId
        if cat_id not in grouped:
            grouped[cat_id] = []
        grouped[cat_id].append(item)
    
    lines = ["🛒 *LISTA DE LA COMPRA MERCADONA* 🛒", ""]
    for cat in sorted(MERCADONA_CATEGORIES, key=lambda c: c["order"]):
        cat_items = grouped.get(cat["id"])
        if not cat_items:
            continue
        lines.append(f"{cat['emoji']} *{cat['name'].upper()}*")
        for item in cat_items:
            check = "✅" if item.completed else "⬜"
            price = f" (~{(item.estimatedPrice * item.quantity):.2f}€)" if item.estimatedPrice else ""
            note = f" _({item.notes})_" if item.notes else ""
            lines.append(f"{check} {item.name} ({item.quantity:g} {item.unit}){price}{note}")
        lines.append("")
    
    lines.append(f"💰 *Total estimado:* {stats.totalEstimated:.2f} €")
    lines.append(f"📦 *Artículos:* {stats.completedItems}/{stats.totalItems} comprados")
    
    return ShareTextResponse(shareText="\n".join(lines))

@router.post("/reset-sample", response_model=List[ShoppingItemResponse])
def reset_sample(db: sqlite3.Connection = Depends(get_db)):
    """Restaurar productos de ejemplo predefinidos de Mercadona."""
    crud.seed_sample_data(db)
    return crud.get_items(db, sort_by="aisle")

@router.delete("/completed", status_code=status.HTTP_200_OK)
def delete_completed(db: sqlite3.Connection = Depends(get_db)):
    """Eliminar todos los productos marcados como comprados."""
    count = crud.clear_completed(db)
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
    """Actualizar datos de un producto (cantidad, precio, notas, prioridad, etc.)."""
    updated = crud.update_item(db, item_id, item_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return updated

@router.patch("/{item_id}/toggle", response_model=ShoppingItemResponse)
def toggle_item(item_id: str, db: sqlite3.Connection = Depends(get_db)):
    """Alternar estado comprado/pendiente de un producto."""
    toggled = crud.toggle_item(db, item_id)
    if not toggled:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return toggled

@router.delete("/{item_id}", status_code=status.HTTP_200_OK)
def delete_item(item_id: str, db: sqlite3.Connection = Depends(get_db)):
    """Eliminar un producto de la lista."""
    success = crud.delete_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"success": True, "id": item_id}
