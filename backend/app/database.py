import sqlite3
import os
import time
from typing import Generator

def _resolve_db_path(database_url: str) -> str:
    """Acepta sqlite:///./mercadona.db, sqlite:///C:/ruta/x.db o una ruta directa."""
    if database_url.startswith("sqlite:///"):
        return database_url[len("sqlite:///"):]
    if database_url.startswith("sqlite://"):
        return database_url[len("sqlite://"):]
    return database_url


DB_FILE = os.path.abspath(_resolve_db_path(os.getenv("DATABASE_URL", "sqlite:///./mercadona.db")))

def init_db():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    cursor = conn.cursor()

    # 1. Create shopping_lists table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS shopping_lists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        emoji TEXT NOT NULL DEFAULT '🛒',
        color TEXT NOT NULL DEFAULT '#059669',
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
    );
    """)

    # 2. Create shopping_items table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS shopping_items (
        id TEXT PRIMARY KEY,
        list_id TEXT NOT NULL DEFAULT 'default',
        name TEXT NOT NULL,
        category_id TEXT NOT NULL DEFAULT 'otros',
        brand TEXT NOT NULL DEFAULT 'General',
        quantity REAL NOT NULL DEFAULT 1.0,
        unit TEXT NOT NULL DEFAULT 'ud',
        estimated_price REAL,
        notes TEXT,
        completed INTEGER NOT NULL DEFAULT 0,
        in_cart INTEGER NOT NULL DEFAULT 0,
        priority TEXT NOT NULL DEFAULT 'media',
        created_at INTEGER NOT NULL
    );
    """)

    # Check and add list_id and in_cart columns if migrating existing table
    cursor.execute("PRAGMA table_info(shopping_items)")
    columns = [row[1] for row in cursor.fetchall()]
    if "list_id" not in columns:
        cursor.execute("ALTER TABLE shopping_items ADD COLUMN list_id TEXT NOT NULL DEFAULT 'default'")
    if "in_cart" not in columns:
        cursor.execute("ALTER TABLE shopping_items ADD COLUMN in_cart INTEGER NOT NULL DEFAULT 0")

    # 3. Ensure a default shopping list exists
    cursor.execute("SELECT COUNT(*) FROM shopping_lists")
    if cursor.fetchone()[0] == 0:
        now = int(time.time() * 1000)
        cursor.execute("""
            INSERT INTO shopping_lists (id, name, emoji, color, is_archived, created_at)
            VALUES (?, ?, ?, ?, 0, ?)
        """, ('default', 'Compra Principal', '🛒', '#059669', now))

        cursor.execute("""
            INSERT INTO shopping_lists (id, name, emoji, color, is_archived, created_at)
            VALUES (?, ?, ?, ?, 0, ?)
        """, ('list-2', 'Barbacoa fin de semana', '🥩', '#ea580c', now + 1000))

    # 4. Create recipes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL DEFAULT 'general',
        servings INTEGER NOT NULL DEFAULT 2,
        prep_time_min INTEGER NOT NULL DEFAULT 30,
        image_emoji TEXT NOT NULL DEFAULT '🍽️',
        tags TEXT DEFAULT '',
        created_at INTEGER NOT NULL
    );
    """)

    # 5. Create recipe_ingredients table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id TEXT PRIMARY KEY,
        recipe_id TEXT NOT NULL,
        name TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 1.0,
        unit TEXT NOT NULL DEFAULT 'ud',
        category_id TEXT NOT NULL DEFAULT 'otros',
        estimated_price REAL,
        is_optional INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );
    """)

    # 6. Create productos table (Mercadona DB schema)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        precio REAL NOT NULL,
        peso_neto_gr REAL,
        euros_kg REAL
    );
    """)

    # 7. Create recetas table (Mercadona DB schema)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recetas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        nombre_usuario TEXT DEFAULT 'Anónimo'
    );
    """)

    # 8. Create receta_ingredientes table (Mercadona DB schema)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS receta_ingredientes (
        receta_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL,
        cantidad_necesaria_gr REAL NOT NULL,
        PRIMARY KEY (receta_id, producto_id)
    );
    """)

    # Seed productos, recetas, and recipe data if empty
    cursor.execute("SELECT COUNT(*) FROM recetas")
    recetas_count = cursor.fetchone()[0]

    # Look for mercadITo_recetas.db in workspace or current dir
    root_source = os.path.abspath("mercadITo_recetas.db")
    if not os.path.exists(root_source):
        # try parent directory
        parent_source = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "mercadITo_recetas.db"))
        if os.path.exists(parent_source):
            root_source = parent_source

    if recetas_count == 0 and os.path.exists(root_source) and os.path.abspath(root_source) != os.path.abspath(DB_FILE):
        try:
            s_conn = sqlite3.connect(root_source)
            s_conn.row_factory = sqlite3.Row
            s_prods = s_conn.execute("SELECT * FROM productos").fetchall()
            for p in s_prods:
                cursor.execute("""
                    INSERT OR IGNORE INTO productos (id, nombre, precio, peso_neto_gr, euros_kg)
                    VALUES (?, ?, ?, ?, ?)
                """, (p["id"], p["nombre"], p["precio"], p["peso_neto_gr"], p["euros_kg"]))

            s_rec = s_conn.execute("SELECT * FROM recetas").fetchall()
            for r in s_rec:
                cursor.execute("""
                    INSERT OR IGNORE INTO recetas (id, nombre, nombre_usuario)
                    VALUES (?, ?, ?)
                """, (r["id"], r["nombre"], r["nombre_usuario"]))

            s_ri = s_conn.execute("SELECT * FROM receta_ingredientes").fetchall()
            for ri in s_ri:
                cursor.execute("""
                    INSERT OR IGNORE INTO receta_ingredientes (receta_id, producto_id, cantidad_necesaria_gr)
                    VALUES (?, ?, ?)
                """, (ri["receta_id"], ri["producto_id"], ri["cantidad_necesaria_gr"]))

            s_conn.close()
        except Exception as e:
            print("Error syncing from mercadITo_recetas.db:", e)

    # Ensure third recipe exists if Pechuga de pollo is available
    cursor.execute("SELECT id FROM productos WHERE nombre LIKE '%pollo%'")
    pollo_row = cursor.fetchone()
    if pollo_row:
        cursor.execute("SELECT id FROM recetas WHERE nombre LIKE '%pollo%'")
        if not cursor.fetchone():
            cursor.execute("INSERT INTO recetas (nombre, nombre_usuario) VALUES (?, ?)", ("Pechuga de pollo a la plancha", "Anónimo"))
            new_r_id = cursor.lastrowid
            cursor.execute("INSERT OR IGNORE INTO receta_ingredientes (receta_id, producto_id, cantidad_necesaria_gr) VALUES (?, ?, ?)", (new_r_id, pollo_row[0], 200.0))
            # aceite
            cursor.execute("SELECT id FROM productos WHERE nombre LIKE '%aceite%'")
            aceite_row = cursor.fetchone()
            if aceite_row:
                cursor.execute("INSERT OR IGNORE INTO receta_ingredientes (receta_id, producto_id, cantidad_necesaria_gr) VALUES (?, ?, ?)", (new_r_id, aceite_row[0], 15.0))
            # sal
            cursor.execute("SELECT id FROM productos WHERE nombre LIKE '%sal%'")
            sal_row = cursor.fetchone()
            if sal_row:
                cursor.execute("INSERT OR IGNORE INTO receta_ingredientes (receta_id, producto_id, cantidad_necesaria_gr) VALUES (?, ?, ?)", (new_r_id, sal_row[0], 2.0))

    # Sync any recetas into recipes table
    cursor.execute("SELECT * FROM recetas")
    all_recetas = cursor.fetchall()
    now = int(time.time() * 1000)
    category_map = {
        "arroz": "despensa-conservas",
        "tomate": "despensa-conservas",
        "macarrones": "despensa-conservas",
        "carne": "carne",
        "pollo": "carne",
        "queso": "charcuteria-quesos",
        "huevo": "lacteos-huevos",
        "huevos": "lacteos-huevos",
        "aceite": "despensa-conservas",
        "sal": "despensa-conservas",
    }
    for idx, rec in enumerate(all_recetas):
        rec_id = f"recipe_{rec[0]}"
        rec_name = rec[1]
        cursor.execute("SELECT id FROM recipes WHERE id = ? OR name = ?", (rec_id, rec_name))
        if cursor.fetchone():
            continue
        emoji = "🍝" if "macarr" in rec_name.lower() else ("🍳" if "arroz" in rec_name.lower() or "huevo" in rec_name.lower() else ("🍗" if "pollo" in rec_name.lower() else "🍽️"))
        cursor.execute("""
            INSERT INTO recipes (id, name, description, category, servings, prep_time_min, image_emoji, tags, created_at)
            VALUES (?, ?, ?, 'comida', 2, 25, ?, 'mercadona,delicioso', ?)
        """, (rec_id, rec_name, f"Deliciosa receta de {rec_name} elaborada con ingredientes de Mercadona.", emoji, now + idx * 1000))

        cursor.execute("""
            SELECT p.nombre, p.precio, ri.cantidad_necesaria_gr
            FROM receta_ingredientes ri
            JOIN productos p ON p.id = ri.producto_id
            WHERE ri.receta_id = ?
        """, (rec[0],))
        for ing_row in cursor.fetchall():
            p_name = ing_row[0]
            p_price = ing_row[1]
            p_cat = "otros"
            for k, v in category_map.items():
                if k in p_name.lower():
                    p_cat = v
                    break
            cursor.execute("""
                INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit, category_id, estimated_price, is_optional)
                VALUES (?, ?, ?, 1.0, 'ud', ?, ?, 0)
            """, (f"ing_{rec[0]}_{hash(p_name) & 0xfffffff}", rec_id, p_name, p_cat, p_price))

    conn.commit()
    conn.close()

# Ensure table exists on import
init_db()

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()
