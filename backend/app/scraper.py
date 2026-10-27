"""
Mercadona Real Products Scraper.

Extracts real products from the official Mercadona frontend API (tienda.mercadona.es).
Maps them to the application's categories, brands, and units, and persists them into SQLite.
"""

import json
import logging
import sqlite3
import time
import urllib.request
import urllib.error
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("mercadona_scraper")

MERCADONA_API_BASE = "https://tienda.mercadona.es/api"
CATEGORIES_URL = f"{MERCADONA_API_BASE}/categories/"

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-ES,es;q=0.9",
    "Origin": "https://tienda.mercadona.es",
    "Referer": "https://tienda.mercadona.es/",
}

# Mapping between Mercadona category / subcategory keywords and our app's categories
CATEGORY_KEYWORD_MAP = [
    ("aceite", "despensa-conservas"),
    ("especias", "despensa-conservas"),
    ("salsas", "despensa-conservas"),
    ("agua", "bebidas"),
    ("refresco", "bebidas"),
    ("isotónico", "bebidas"),
    ("aperitivo", "aperitivos-dulces"),
    ("patatas fritas", "aperitivos-dulces"),
    ("frutos secos", "aperitivos-dulces"),
    ("arroz", "despensa-conservas"),
    ("legumbre", "despensa-conservas"),
    ("pasta", "despensa-conservas"),
    ("azúcar", "aperitivos-dulces"),
    ("caramelo", "aperitivos-dulces"),
    ("chocolate", "aperitivos-dulces"),
    ("turrón", "aperitivos-dulces"),
    ("bebé", "perfumeria"),
    ("cerveza", "bebidas"),
    ("vino", "bebidas"),
    ("licor", "bebidas"),
    ("sidra", "bebidas"),
    ("bodega", "bebidas"),
    ("cacao", "despensa-conservas"),
    ("café", "despensa-conservas"),
    ("infusión", "despensa-conservas"),
    ("té", "despensa-conservas"),
    ("carne", "carne"),
    ("pollo", "carne"),
    ("cerdo", "carne"),
    ("vacuno", "carne"),
    ("embutido", "charcuteria-quesos"),
    ("jamón", "charcuteria-quesos"),
    ("queso", "charcuteria-quesos"),
    ("charcutería", "charcuteria-quesos"),
    ("congelado", "congelados"),
    ("helado", "congelados"),
    ("conserva", "despensa-conservas"),
    ("caldo", "despensa-conservas"),
    ("crema", "despensa-conservas"),
    ("cabello", "perfumeria"),
    ("facial", "perfumeria"),
    ("corporal", "perfumeria"),
    ("higiene", "perfumeria"),
    ("maquillaje", "perfumeria"),
    ("parafarmacia", "perfumeria"),
    ("afeitado", "perfumeria"),
    ("dental", "perfumeria"),
    ("fruta", "fruta-verdura"),
    ("verdura", "fruta-verdura"),
    ("huevo", "lacteos-huevos"),
    ("leche", "lacteos-huevos"),
    ("mantequilla", "lacteos-huevos"),
    ("lácteo", "lacteos-huevos"),
    ("limpieza", "limpieza"),
    ("lavavajillas", "limpieza"),
    ("detergente", "limpieza"),
    ("lejía", "limpieza"),
    ("friegasuelos", "limpieza"),
    ("celulosa", "limpieza"),
    ("marisco", "pescado"),
    ("pescado", "pescado"),
    ("mascota", "mascotas"),
    ("perro", "mascotas"),
    ("gato", "mascotas"),
    ("panadería", "horno-pan"),
    ("pastelería", "horno-pan"),
    ("pan", "horno-pan"),
    ("bollería", "horno-pan"),
    ("harina", "horno-pan"),
    ("pizza", "congelados"),
    ("plato preparado", "horno-pan"),
    ("postre", "lacteos-huevos"),
    ("yogur", "lacteos-huevos"),
    ("zumo", "bebidas"),
]


def detect_brand(name: str) -> str:
    """Classifies brand based on standard Mercadona private brands."""
    n = name.lower()
    if "hacendado" in n:
        return "Hacendado"
    if "bosque verde" in n:
        return "Bosque Verde"
    if "deliplus" in n:
        return "Deliplus"
    if "compy" in n:
        return "Compy"
    return "General"


def detect_unit(packaging: str, size_format: str, ref_format: str) -> str:
    """Maps packaging/size metadata into the allowed UnitType literal."""
    pkg = (packaging or "").lower()
    fmt = (size_format or "").lower()
    rf = (ref_format or "").lower()

    if "bandeja" in pkg:
        return "bandeja"
    if "pack" in pkg:
        return "pack"
    if "docena" in pkg or "docena" in fmt:
        return "docena"
    if "litro" in pkg or fmt in ("l", "litro") or rf in ("l", "litro"):
        return "litro"
    if fmt == "kg" or rf == "kg" or "kilo" in pkg:
        return "kg"
    if fmt == "g" or "gramo" in pkg:
        return "g"
    return "ud"


def map_category(category_name: str, subcategory_name: str = "") -> str:
    """Finds the most specific application category for a Mercadona section."""
    combined = f"{subcategory_name} {category_name}".lower()
    for kw, target_cat in CATEGORY_KEYWORD_MAP:
        if kw in combined:
            return target_cat
    return "otros"


def _http_get_json(url: str, timeout: int = 15) -> Optional[Dict[str, Any]]:
    """Safe HTTP GET returning parsed JSON."""
    req = urllib.request.Request(url, headers=DEFAULT_HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status == 200:
                raw = resp.read().decode("utf-8")
                return json.loads(raw)
    except Exception as exc:
        logger.warning(f"Error fetching {url}: {exc}")
    return None


def fetch_categories_tree() -> List[Dict[str, Any]]:
    """Fetches the root categories list from Mercadona."""
    data = _http_get_json(CATEGORIES_URL)
    if not data or "results" not in data:
        return []
    return data["results"]


def fetch_subcategory_products(subcat_id: int) -> List[Dict[str, Any]]:
    """Fetches detailed products for a specific subcategory."""
    url = f"{MERCADONA_API_BASE}/categories/{subcat_id}/"
    data = _http_get_json(url)
    if not data:
        return []

    products: List[Dict[str, Any]] = []
    cat_name = data.get("name", "")

    # Products can be inside nested categories/aisles
    for aisle in data.get("categories", []):
        aisle_name = aisle.get("name", "")
        for prod in aisle.get("products", []):
            parsed = parse_mercadona_product(prod, cat_name, aisle_name)
            if parsed:
                products.append(parsed)

    return products


def parse_mercadona_product(prod: Dict[str, Any], cat_name: str, subcat_name: str = "") -> Optional[Dict[str, Any]]:
    """Parses a single raw Mercadona product into our schema."""
    if not prod.get("id"):
        return None

    price_info = prod.get("price_instructions") or {}
    try:
        unit_price = float(price_info.get("unit_price") or 0.0)
    except (ValueError, TypeError):
        unit_price = 0.0

    bulk_price = None
    if price_info.get("bulk_price"):
        try:
            bulk_price = float(price_info["bulk_price"])
        except (ValueError, TypeError):
            bulk_price = None

    display_name = prod.get("display_name")
    if not display_name:
        slug = prod.get("slug", "")
        display_name = slug.replace("-", " ").title() if slug else f"Producto {prod['id']}"

    packaging = prod.get("packaging") or ""
    size_format = price_info.get("size_format") or ""
    ref_format = price_info.get("reference_format") or ""

    unit = detect_unit(packaging, size_format, ref_format)
    brand = detect_brand(display_name)
    category_id = map_category(cat_name, subcat_name)

    return {
        "id": str(prod["id"]),
        "name": display_name,
        "categoryId": category_id,
        "brand": brand,
        "defaultUnit": unit,
        "typicalPrice": round(unit_price, 2),
        "bulkPrice": round(bulk_price, 2) if bulk_price is not None else None,
        "packaging": packaging,
        "thumbnail": prod.get("thumbnail"),
        "shareUrl": prod.get("share_url"),
        "popular": False,
    }


def save_products_to_db(conn: sqlite3.Connection, products: List[Dict[str, Any]]) -> int:
    """Inserts or updates scraped products into the SQLite database."""
    if not products:
        return 0

    cursor = conn.cursor()
    now = int(time.time() * 1000)

    # Ensure table exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mercadona_catalog_products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category_id TEXT NOT NULL,
        brand TEXT NOT NULL DEFAULT 'General',
        default_unit TEXT NOT NULL DEFAULT 'ud',
        typical_price REAL NOT NULL,
        bulk_price REAL,
        packaging TEXT,
        thumbnail TEXT,
        share_url TEXT,
        is_popular INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL
    );
    """)

    saved_count = 0
    for p in products:
        cursor.execute("""
            INSERT INTO mercadona_catalog_products (
                id, name, category_id, brand, default_unit, typical_price, bulk_price,
                packaging, thumbnail, share_url, is_popular, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name=excluded.name,
                category_id=excluded.category_id,
                brand=excluded.brand,
                default_unit=excluded.default_unit,
                typical_price=excluded.typical_price,
                bulk_price=excluded.bulk_price,
                packaging=excluded.packaging,
                thumbnail=excluded.thumbnail,
                share_url=excluded.share_url,
                updated_at=excluded.updated_at
        """, (
            p["id"],
            p["name"],
            p["categoryId"],
            p["brand"],
            p["defaultUnit"],
            p["typicalPrice"],
            p.get("bulkPrice"),
            p.get("packaging"),
            p.get("thumbnail"),
            p.get("shareUrl"),
            1 if p.get("popular") else 0,
            now,
        ))

        # Also register in legacy productos table so recipe cost estimations benefit
        num_id = int(p["id"]) if p["id"].isdigit() else None
        cursor.execute("""
            INSERT OR REPLACE INTO productos (id, nombre, precio, peso_neto_gr, euros_kg)
            VALUES (?, ?, ?, ?, ?)
        """, (
            num_id,
            p["name"],
            p["typicalPrice"],
            None,
            p.get("bulkPrice")
        ))
        saved_count += 1

    conn.commit()
    return saved_count


def scrape_mercadona(
    conn: sqlite3.Connection,
    max_categories: Optional[int] = None,
    delay_between_requests: float = 0.3,
) -> Dict[str, Any]:
    """
    Orchestrates scraping of Mercadona products and persists them into the DB.

    :param conn: Active SQLite connection
    :param max_categories: Optional limit to scrape only top N categories (useful for fast sync)
    :param delay_between_requests: Politeness delay in seconds
    :return: Summary dictionary with count of scraped categories and products
    """
    logger.info("Starting Mercadona products scrape...")
    root_cats = fetch_categories_tree()
    if not root_cats:
        return {
            "success": False,
            "error": "No se pudo obtener el árbol de categorías de Mercadona (¿sin conexión a internet?)",
            "categoriesScraped": 0,
            "productsScraped": 0,
        }

    total_products = 0
    categories_scraped = 0
    scraped_cats = root_cats[:max_categories] if max_categories else root_cats

    all_parsed_products: List[Dict[str, Any]] = []

    for cat in scraped_cats:
        cat_name = cat.get("name", "")
        subcats = cat.get("categories", [])
        categories_scraped += 1

        for subcat in subcats:
            subcat_id = subcat.get("id")
            if not subcat_id:
                continue

            products = fetch_subcategory_products(subcat_id)
            all_parsed_products.extend(products)
            time.sleep(delay_between_requests)

    saved_count = save_products_to_db(conn, all_parsed_products)

    return {
        "success": True,
        "categoriesScraped": categories_scraped,
        "productsScraped": saved_count,
        "message": f"Se han sincronizado {saved_count} productos reales de Mercadona.",
    }


def get_scraped_products(
    conn: sqlite3.Connection,
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> Tuple[List[Dict[str, Any]], int]:
    """Retrieves scraped products from the local SQLite database with filtering."""
    cursor = conn.cursor()

    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='mercadona_catalog_products'")
    if not cursor.fetchone():
        return [], 0

    query = "SELECT * FROM mercadona_catalog_products WHERE 1=1"
    count_query = "SELECT COUNT(*) FROM mercadona_catalog_products WHERE 1=1"
    params: List[Any] = []

    if category_id and category_id != "all":
        query += " AND category_id = ?"
        count_query += " AND category_id = ?"
        params.append(category_id)

    if search:
        s = f"%{search.lower().strip()}%"
        query += " AND (LOWER(name) LIKE ? OR LOWER(brand) LIKE ?)"
        count_query += " AND (LOWER(name) LIKE ? OR LOWER(brand) LIKE ?)"
        params.extend([s, s])

    # Count total matching
    cursor.execute(count_query, params)
    total = cursor.fetchone()[0]

    # Order and paginate
    query += " ORDER BY is_popular DESC, name ASC LIMIT ? OFFSET ?"
    query_params = list(params) + [limit, offset]

    cursor.execute(query, query_params)
    rows = cursor.fetchall()

    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "name": r["name"],
            "categoryId": r["category_id"],
            "brand": r["brand"],
            "defaultUnit": r["default_unit"],
            "typicalPrice": float(r["typical_price"]),
            "bulkPrice": float(r["bulk_price"]) if r["bulk_price"] is not None else None,
            "packaging": r["packaging"],
            "thumbnail": r["thumbnail"],
            "shareUrl": r["share_url"],
            "popular": bool(r["is_popular"]),
        })

    return results, total


def get_scraper_stats(conn: sqlite3.Connection) -> Dict[str, Any]:
    """Returns database statistics about scraped Mercadona products."""
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='mercadona_catalog_products'")
    if not cursor.fetchone():
        return {"totalProducts": 0, "lastUpdated": None, "hasRealData": False}

    cursor.execute("SELECT COUNT(*), MAX(updated_at) FROM mercadona_catalog_products")
    row = cursor.fetchone()
    total = row[0] or 0
    last_updated = row[1]

    return {
        "totalProducts": total,
        "lastUpdated": last_updated,
        "hasRealData": total > 0,
    }
