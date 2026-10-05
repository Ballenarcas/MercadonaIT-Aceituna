import os
import pytest
import sqlite3
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, init_db
from app import crud

@pytest.fixture
def db_conn(tmp_path):
    """Creates a fresh, isolated SQLite database file for testing."""
    test_db_path = str(tmp_path / "test_mercadona.db")
    
    # Connect and initialize schema
    conn = sqlite3.connect(test_db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
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
    
    # Recipe tables
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
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id TEXT PRIMARY KEY,
        recipe_id TEXT NOT NULL,
        name TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 1.0,
        unit TEXT NOT NULL DEFAULT 'ud',
        category_id TEXT NOT NULL DEFAULT 'otros',
        estimated_price REAL,
        is_optional INTEGER NOT NULL DEFAULT 0
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        precio REAL NOT NULL,
        peso_neto_gr REAL,
        euros_kg REAL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recetas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        nombre_usuario TEXT DEFAULT 'Anónimo'
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS receta_ingredientes (
        receta_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL,
        cantidad_necesaria_gr REAL NOT NULL,
        PRIMARY KEY (receta_id, producto_id)
    );
    """)

    # Seed recipes for tests
    cursor.execute("""
        INSERT INTO recipes (id, name, description, category, servings, prep_time_min, image_emoji, tags, created_at)
        VALUES ('recipe_1', 'Macarrones a la boloñesa', 'Pasta con carne', 'comida', 2, 25, '🍝', 'pasta', 100000),
               ('recipe_2', 'Arroz a la cubana con huevo', 'Arroz con tomate y huevo', 'comida', 2, 20, '🍳', 'arroz', 101000)
    """)

    cursor.execute("""
        INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit, category_id, estimated_price, is_optional)
        VALUES ('ing_1', 'recipe_1', 'Macarrones Hacendado', 1.0, 'ud', 'despensa-conservas', 0.85, 0),
               ('ing_2', 'recipe_1', 'Tomate frito receta artesana Hacendado', 1.0, 'ud', 'despensa-conservas', 1.70, 0),
               ('ing_3', 'recipe_1', 'Carne picada mixta de cerdo y vacuno', 1.0, 'ud', 'carne', 3.25, 0),
               ('ing_4', 'recipe_1', 'Queso rallado mozzarella Hacendado', 1.0, 'ud', 'charcuteria-quesos', 1.45, 0),
               ('ing_5', 'recipe_1', 'Aceite de Oliva Virgen Extra Hacendado', 1.0, 'ud', 'despensa-conservas', 8.95, 0),
               ('ing_6', 'recipe_1', 'Sal fina de mesa', 1.0, 'ud', 'despensa-conservas', 0.35, 0),
               ('ing_7', 'recipe_2', 'Arroz redondo Hacendado', 1.0, 'ud', 'despensa-conservas', 1.30, 0),
               ('ing_8', 'recipe_2', 'Tomate frito receta artesana Hacendado', 1.0, 'ud', 'despensa-conservas', 1.70, 0),
               ('ing_9', 'recipe_2', 'Huevos camperos tamaño L (12 ud)', 1.0, 'ud', 'lacteos-huevos', 2.45, 0),
               ('ing_10', 'recipe_2', 'Aceite de Oliva Virgen Extra Hacendado', 1.0, 'ud', 'despensa-conservas', 8.95, 0),
               ('ing_11', 'recipe_2', 'Sal fina de mesa', 1.0, 'ud', 'despensa-conservas', 0.35, 0)
    """)

    # Insert default lists
    cursor.execute("""
        INSERT INTO shopping_lists (id, name, emoji, color, is_archived, created_at)
        VALUES ('default', 'Compra Principal', '🛒', '#059669', 0, 100000)
    """)
    cursor.execute("""
        INSERT INTO shopping_lists (id, name, emoji, color, is_archived, created_at)
        VALUES ('list-barbacoa', 'Barbacoa', '🥩', '#ea580c', 0, 101000)
    """)
    conn.commit()

    yield conn
    conn.close()

@pytest.fixture
def client(db_conn):
    """FastAPI TestClient with overridden database dependency."""
    def override_get_db():
        yield db_conn

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
