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
