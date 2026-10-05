import sqlite3
import os
import time
import hashlib
from typing import Generator

def _resolve_db_path(database_url: str) -> str:
    """Acepta sqlite:///./mercadona.db, sqlite:///C:/ruta/x.db o una ruta directa."""
    if database_url.startswith("sqlite:///"):
        return database_url[len("sqlite:///"):]
    if database_url.startswith("sqlite://"):
        return database_url[len("sqlite://"):]
    return database_url


def _default_db_file() -> str:
    """Ruta por defecto anclada a la raíz del repo (no depende del CWD).

    Evita BD fantasmas como backend/mercadona.db al arrancar desde otra carpeta.
    Se puede override con DATABASE_URL.
    """
    here = os.path.dirname(os.path.abspath(__file__))  # backend/app
    repo_root = os.path.dirname(os.path.dirname(here))  # repo
    return os.path.join(repo_root, "mercadona.db")


DB_FILE = os.path.abspath(
    _resolve_db_path(os.getenv("DATABASE_URL", "sqlite:///" + _default_db_file()))
)

SEED_USERS = [
    ("user-ana", "Ana García", "ana.garcia@example.com"),
    ("user-carlos", "Carlos Ruiz", "carlos.ruiz@example.com"),
    ("user-marta", "Marta López", "marta.lopez@example.com"),
    ("user-diego", "Diego Martín", "diego.martin@example.com"),
]

SEED_RECIPES = [
    {
        "id": "recipe-ensalada-quinoa",
        "name": "Ensalada templada de quinoa y verduras",
        "description": "Quinoa con verduras asadas, aguacate y aliño de limón.",
        "category": "comida",
        "servings": 2,
        "prep_time_min": 30,
        "image_emoji": "🥗",
        "tags": "saludable,vegetariano,quinoa",
        "user_id": "user-ana",
        "ingredients": [
            ("Quinoa", 1, "ud", "despensa-conservas", 2.75, 0),
            ("Calabacín", 1, "ud", "fruta-verdura", 0.66, 0),
            ("Pimiento rojo", 1, "ud", "fruta-verdura", 1.10, 0),
            ("Aguacate", 1, "ud", "fruta-verdura", 1.35, 0),
            ("Limón", 1, "ud", "fruta-verdura", 0.35, 0),
            ("Aceite de oliva virgen extra", 1, "litro", "despensa-conservas", 4.70, 0),
        ],
    },
    {
        "id": "recipe-salmon-verduras",
        "name": "Salmón al horno con verduras",
        "description": "Lomos de salmón al horno con patata, cebolla y limón.",
        "category": "cena",
        "servings": 2,
        "prep_time_min": 35,
        "image_emoji": "🐟",
        "tags": "pescado,horno,rapida",
        "user_id": "user-carlos",
        "ingredients": [
            ("Lomos de salmón", 1, "bandeja", "pescado", 6.50, 0),
            ("Patata", 1, "kg", "fruta-verdura", 1.12, 0),
            ("Cebolla", 1, "ud", "fruta-verdura", 0.45, 0),
            ("Limón", 1, "ud", "fruta-verdura", 0.35, 0),
            ("Aceite de oliva virgen extra", 1, "litro", "despensa-conservas", 4.70, 0),
        ],
    },
    {
        "id": "recipe-tortilla-patata",
        "name": "Tortilla de patata con cebolla",
        "description": "Tortilla jugosa de patata y cebolla para compartir.",
        "category": "cena",
        "servings": 4,
        "prep_time_min": 45,
        "image_emoji": "🍳",
        "tags": "huevos,tradicional,española",
        "user_id": "user-marta",
        "ingredients": [
            ("Patata", 1, "kg", "fruta-verdura", 1.12, 0),
            ("Huevos camperos", 1, "docena", "lacteos-huevos", 3.35, 0),
            ("Cebolla", 1, "ud", "fruta-verdura", 0.45, 1),
            ("Aceite de oliva virgen extra", 1, "litro", "despensa-conservas", 4.70, 0),
            ("Sal fina", 1, "ud", "despensa-conservas", 0.35, 0),
        ],
    },
    {
        "id": "recipe-lentejas-verduras",
        "name": "Lentejas guisadas con verduras",
        "description": "Guiso casero de lentejas, zanahoria, tomate y pimiento.",
        "category": "comida",
        "servings": 4,
        "prep_time_min": 50,
        "image_emoji": "🍲",
        "tags": "legumbres,casera,vegetariano",
        "user_id": "user-diego",
        "ingredients": [
            ("Lentejas pardinas", 1, "ud", "despensa-conservas", 1.85, 0),
            ("Zanahoria", 1, "ud", "fruta-verdura", 0.18, 0),
            ("Pimiento verde", 1, "ud", "fruta-verdura", 0.55, 0),
            ("Tomate triturado", 1, "ud", "despensa-conservas", 0.55, 0),
            ("Cebolla", 1, "ud", "fruta-verdura", 0.45, 0),
            ("Pimentón dulce", 1, "ud", "despensa-conservas", 1.20, 0),
        ],
    },
]

def init_db(seed: bool = False):
    """Crea el esquema (siempre) y, solo si seed=True, sincroniza datos semilla.

    Separar el seed evita escrituras pesadas en cada import: al importar solo
    se garantiza el esquema; los datos se siembran desde el lifespan.
    """
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

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        created_at INTEGER NOT NULL
    );
    """)

    cursor.execute("PRAGMA table_info(recipes)")
    recipe_columns = [row[1] for row in cursor.fetchall()]
    if "user_id" not in recipe_columns:
        cursor.execute("ALTER TABLE recipes ADD COLUMN user_id TEXT")

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

    # Migrate quantities created before the API unit enum was restricted.
    cursor.execute("UPDATE recipe_ingredients SET unit = 'g' WHERE unit = 'ml'")

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

    # Seed productos, recetas, and recipe data if empty (solo con seed=True,
    # para no hacer escrituras pesadas en cada import).
    if not seed:
        conn.commit()
        conn.close()
        return

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
            SELECT p.nombre, p.precio, p.peso_neto_gr, ri.cantidad_necesaria_gr
            FROM receta_ingredientes ri
            JOIN productos p ON p.id = ri.producto_id
            WHERE ri.receta_id = ?
        """, (rec[0],))
        for ing_row in cursor.fetchall():
            p_name = ing_row[0]
            grams = ing_row[3] or 0
            if grams and ing_row[2]:
                # Prorratea el precio del envase a los gramos de la receta
                ing_price: float | None = round(ing_row[1] * grams / ing_row[2], 2)
            else:
                ing_price = ing_row[1]
            p_cat = "otros"
            for k, v in category_map.items():
                if k in p_name.lower():
                    p_cat = v
                    break
            stable_hash = hashlib.md5(p_name.encode("utf-8")).hexdigest()[:7]
            cursor.execute("""
                INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit, category_id, estimated_price, is_optional)
                VALUES (?, ?, ?, ?, 'g', ?, ?, 0)
            """, (f"ing_{rec[0]}_{stable_hash}", rec_id, p_name, grams or 1.0, p_cat, ing_price))

    # Add stable users and richer recipes to every existing database.
    for user_id, name, email in SEED_USERS:
        cursor.execute(
            "INSERT OR IGNORE INTO users (id, name, email, created_at) VALUES (?, ?, ?, ?)",
            (user_id, name, email, now),
        )

    legacy_users = cursor.execute(
        "SELECT DISTINCT nombre_usuario FROM recetas WHERE nombre_usuario IS NOT NULL AND TRIM(nombre_usuario) != ''"
    ).fetchall()
    for (legacy_name,) in legacy_users:
        legacy_id = f"user-legacy-{hashlib.sha1(legacy_name.encode('utf-8')).hexdigest()[:12]}"
        cursor.execute(
            "INSERT OR IGNORE INTO users (id, name, email, created_at) VALUES (?, ?, NULL, ?)",
            (legacy_id, legacy_name, now),
        )

    for recipe in SEED_RECIPES:
        cursor.execute("SELECT id FROM recipes WHERE id = ? OR name = ?", (recipe["id"], recipe["name"]))
        if cursor.fetchone():
            continue
        cursor.execute("""
            INSERT INTO recipes (id, name, description, category, servings, prep_time_min, image_emoji, tags, created_at, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            recipe["id"], recipe["name"], recipe["description"], recipe["category"],
            recipe["servings"], recipe["prep_time_min"], recipe["image_emoji"],
            recipe["tags"], now, recipe["user_id"],
        ))
        for ingredient_index, ingredient in enumerate(recipe["ingredients"]):
            cursor.execute("""
                INSERT OR IGNORE INTO recipe_ingredients
                    (id, recipe_id, name, quantity, unit, category_id, estimated_price, is_optional)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (f"{recipe['id']}-ingredient-{ingredient_index}", recipe["id"], *ingredient))

    # Link imported legacy recipes to the corresponding user records.
    for rec_id, rec_user in cursor.execute("SELECT id, nombre_usuario FROM recetas").fetchall():
        if not rec_user:
            continue
        legacy_id = f"user-legacy-{hashlib.sha1(rec_user.encode('utf-8')).hexdigest()[:12]}"
        cursor.execute(
            "UPDATE recipes SET user_id = ? WHERE id = ? AND user_id IS NULL",
            (legacy_id, f"recipe_{rec_id}"),
        )

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
