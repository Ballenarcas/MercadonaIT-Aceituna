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
