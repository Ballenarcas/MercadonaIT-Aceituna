import sqlite3
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from ..database import get_db
from ..schemas import (
    CatalogProductResponse,
    ScraperSyncRequest,
    ScraperSyncResponse,
    ScraperStatsResponse,
)
from ..initial_data import POPULAR_CATALOG
from ..scraper import scrape_mercadona, get_scraped_products, get_scraper_stats

router = APIRouter(prefix="/catalog", tags=["Mercadona Catalog"])


@router.get("", response_model=List[CatalogProductResponse])
def get_catalog(
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    popular_only: bool = False,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: sqlite3.Connection = Depends(get_db),
):
    """
    Obtener y buscar productos del catálogo de Mercadona.
    Prioriza los productos reales extraídos con el scraper; si la base de datos
    aún no se ha sincronizado, sirve el catálogo predefinido de productos populares.
    """
    db_products, _ = get_scraped_products(
        db, search=search, category_id=category_id, limit=limit, offset=offset
    )

    if popular_only:
        db_products = [p for p in db_products if p.get("popular")]

    if db_products:
        return [CatalogProductResponse(**p) for p in db_products]

    # Fallback to POPULAR_CATALOG if no DB records found
    results = POPULAR_CATALOG

    if popular_only:
        results = [p for p in results if p.get("popular")]

    if category_id and category_id != "all":
        results = [p for p in results if p.get("categoryId") == category_id]

    if search:
        s = search.lower().strip()
        results = [
            p for p in results
            if s in p["name"].lower() or s in p["brand"].lower()
        ]

    return [CatalogProductResponse(**p) for p in results]


@router.post("/sync", response_model=ScraperSyncResponse)
def sync_catalog(
    req: Optional[ScraperSyncRequest] = None,
    db: sqlite3.Connection = Depends(get_db),
):
    """
    Lanza el scraper para extraer productos reales de Mercadona vía su API oficial
    y los almacena en la base de datos local SQLite.
    """
    max_cats = req.maxCategories if req else None
    delay = req.delay if req else 0.3
    summary = scrape_mercadona(db, max_categories=max_cats, delay_between_requests=delay)

    if not summary.get("success"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=summary.get("error", "Error al conectar con la API de Mercadona"),
        )

    return ScraperSyncResponse(
        success=True,
        categoriesScraped=summary["categoriesScraped"],
        productsScraped=summary["productsScraped"],
        message=summary["message"],
    )


@router.get("/stats", response_model=ScraperStatsResponse)
def get_catalog_stats(db: sqlite3.Connection = Depends(get_db)):
    """Obtener estado del scraper y número de productos reales almacenados."""
    stats = get_scraper_stats(db)
    return ScraperStatsResponse(**stats)
