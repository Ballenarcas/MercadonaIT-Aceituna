#!/usr/bin/env python3
"""
CLI Script to scrape real Mercadona products into the database.

Usage:
    python backend/scrape_mercadona.py
    python backend/scrape_mercadona.py --max-categories 5
    python backend/scrape_mercadona.py --delay 0.5
"""

import argparse
import os
import sys
import time

# Ensure UTF-8 output on Windows consoles
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Ensure backend package can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import get_connection, init_db
from backend.app.scraper import scrape_mercadona, get_scraper_stats


def main():
    parser = argparse.ArgumentParser(description="Scraper oficial de productos de Mercadona para AceitunAI.")
    parser.add_argument(
        "--max-categories",
        type=int,
        default=None,
        help="Número máximo de categorías a extraer (por defecto: todas, ~26 categorías).",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.2,
        help="Tiempo de espera en segundos entre peticiones para cortesía y evitar rate limit (por defecto: 0.2s).",
    )
    args = parser.parse_args()

    print("=" * 65)
    print(" [MERCADONA REAL PRODUCTS SCRAPER] - MercadonaIT Aceituna")
    print("=" * 65)

    init_db(seed=False)
    conn = get_connection()

    try:
        start_stats = get_scraper_stats(conn)
        print(f"Productos actuales en base de datos: {start_stats['totalProducts']}")
        if start_stats.get("lastUpdated"):
            last_date = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(start_stats["lastUpdated"] / 1000))
            print(f"Ultima sincronizacion: {last_date}")

        print("\nIniciando extraccion desde https://tienda.mercadona.es/api/categories/ ...")
        t0 = time.time()
        result = scrape_mercadona(conn, max_categories=args.max_categories, delay_between_requests=args.delay)
        elapsed = round(time.time() - t0, 1)

        if result.get("success"):
            print("\n" + "=" * 65)
            print(f"[OK] Extraccion completada con exito en {elapsed}s!")
            print(f"Categorias analizadas: {result['categoriesScraped']}")
            print(f"Productos guardados / actualizados: {result['productsScraped']}")
            print("=" * 65)
        else:
            print("\n[ERROR] Error durante el scraping:")
            print(result.get("error", "Error desconocido"))
            sys.exit(1)

    finally:
        conn.close()


if __name__ == "__main__":
    main()
