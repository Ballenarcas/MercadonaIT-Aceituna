import sqlite3
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from ..database import get_db
from ..schemas import (
    ShoppingListCreate,
    ShoppingListUpdate,
    ShoppingListResponse,
    BudgetStatsResponse
)
from .. import crud

router = APIRouter(prefix="/lists", tags=["Shopping Lists"])

@router.get("", response_model=List[ShoppingListResponse])
def read_lists(db: sqlite3.Connection = Depends(get_db)):
    """Obtener todas las listas de compra con sus contadores y costes."""
    return crud.get_lists(db)

@router.post("", response_model=ShoppingListResponse, status_code=status.HTTP_201_CREATED)
def create_list(list_in: ShoppingListCreate, db: sqlite3.Connection = Depends(get_db)):
    """Crear una nueva lista de la compra."""
    return crud.create_list(db, list_in)

@router.get("/{list_id}", response_model=ShoppingListResponse)
def read_list(list_id: str, db: sqlite3.Connection = Depends(get_db)):
    """Obtener información de una lista específica."""
    item = crud.get_list(db, list_id)
    if not item:
        raise HTTPException(status_code=404, detail="Lista no encontrada")
    return item

@router.put("/{list_id}", response_model=ShoppingListResponse)
def update_list(list_id: str, list_in: ShoppingListUpdate, db: sqlite3.Connection = Depends(get_db)):
    """Actualizar nombre, emoji o color de una lista."""
    updated = crud.update_list(db, list_id, list_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Lista no encontrada")
    return updated

@router.delete("/{list_id}", status_code=status.HTTP_200_OK)
def delete_list(list_id: str, db: sqlite3.Connection = Depends(get_db)):
    """Eliminar una lista y sus productos asociados."""
    if list_id == "default":
        # Check if there are other lists
        all_lists = crud.get_lists(db)
        if len(all_lists) <= 1:
            raise HTTPException(status_code=400, detail="No puedes eliminar la única lista activa")

    success = crud.delete_list(db, list_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lista no encontrada")
    return {"success": True, "id": list_id}

@router.get("/{list_id}/stats", response_model=BudgetStatsResponse)
def get_list_stats(list_id: str, db: sqlite3.Connection = Depends(get_db)):
    """Obtener estadísticas de presupuesto de una lista (en lista vs en carrito)."""
    return crud.calculate_stats(db, list_id=list_id)

@router.post("/{list_id}/move-all-to-cart", status_code=status.HTTP_200_OK)
def move_all_to_cart(list_id: str, db: sqlite3.Connection = Depends(get_db)):
    """Mover todos los productos de esta lista directamente al carrito."""
    count = crud.move_all_to_cart(db, list_id)
    return {"count": count, "message": f"{count} artículos movidos al carrito"}

@router.delete("/{list_id}/cart", status_code=status.HTTP_200_OK)
def clear_list_cart(list_id: str, db: sqlite3.Connection = Depends(get_db)):
    """Vaciar el carrito de la compra de esta lista."""
    count = crud.clear_cart(db, list_id)
    return {"count": count, "message": f"Carrito vaciado ({count} artículos)"}
