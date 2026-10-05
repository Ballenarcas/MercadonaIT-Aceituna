from typing import List, Optional
from fastapi import APIRouter, Query
from ..schemas import CatalogProductResponse
from ..initial_data import POPULAR_CATALOG

router = APIRouter(prefix="/catalog", tags=["Mercadona Catalog"])

@router.get("", response_model=List[CatalogProductResponse])
def get_catalog(
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    popular_only: bool = False
):
    """Obtener y buscar productos frecuentes del catálogo de Mercadona (Hacendado, Bosque Verde, Deliplus)."""
    results = POPULAR_CATALOG

    if popular_only:
        results = [p for p in results if p.get("popular")]

    if category_id and category_id != "all":
        results = [p for p in results if p.get("categoryId") == category_id]

    if search:
        s = search.lower()
        results = [
            p for p in results
            if s in p["name"].lower() or s in p["brand"].lower()
        ]

    return [CatalogProductResponse(**p) for p in results]
