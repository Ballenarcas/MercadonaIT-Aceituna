"""Regresión de errores críticos de backend.

- Literales sucios en BD no deben tumbar los endpoints (coerción segura).
- servings<=0 debe rechazarse a nivel de schema.
- add_recipe_to_list no debe dividir por cero con servings legacy a 0.
- La ruta de BD por defecto está anclada al repo (no al CWD).
"""

import os

import pytest
from pydantic import ValidationError

from app import crud
from app import database as db_module
from app.schemas import AddRecipeToListRequest


def test_dirty_literals_do_not_crash_item_mapping(db_conn):
    db_conn.execute(
        """INSERT INTO shopping_items
           (id, list_id, name, category_id, brand, quantity, unit,
            estimated_price, notes, completed, in_cart, priority, created_at)
           VALUES ('dirty-1', 'default', 'Cosa rara', 'otros', 'MarcaRara',
                   1.0, 'ml', NULL, NULL, 0, 0, 'urgente', 1000)"""
    )
    db_conn.commit()

    item = crud.get_item(db_conn, "dirty-1")
    assert item is not None
    assert item.brand == "General"  # fallback, sin ValidationError
    assert item.unit == "ud"
    assert item.priority == "media"

    # get_items tampoco debe reventar con la fila sucia delante
    items = crud.get_items(db_conn, list_id="default")
    assert any(i.id == "dirty-1" for i in items)


def test_add_recipe_request_rejects_non_positive_servings():
    with pytest.raises(ValidationError):
        AddRecipeToListRequest(listId="default", servings=0)
    with pytest.raises(ValidationError):
        AddRecipeToListRequest(listId="default", servings=-2)
    # None (por defecto de la receta) sigue siendo válido
    assert AddRecipeToListRequest(listId="default").servings is None


def test_add_recipe_to_list_survives_zero_servings_recipe(db_conn):
    db_conn.execute(
        """CREATE TABLE IF NOT EXISTS recipes (
            id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT,
            category TEXT NOT NULL DEFAULT 'general', servings INTEGER NOT NULL DEFAULT 2,
            prep_time_min INTEGER NOT NULL DEFAULT 30, image_emoji TEXT NOT NULL DEFAULT '🍽️',
            tags TEXT DEFAULT '', created_at INTEGER NOT NULL)"""
    )
    db_conn.execute(
        """CREATE TABLE IF NOT EXISTS recipe_ingredients (
            id TEXT PRIMARY KEY, recipe_id TEXT NOT NULL, name TEXT NOT NULL,
            quantity REAL NOT NULL DEFAULT 1.0, unit TEXT NOT NULL DEFAULT 'ud',
            category_id TEXT NOT NULL DEFAULT 'otros', estimated_price REAL,
            is_optional INTEGER NOT NULL DEFAULT 0)"""
    )
    db_conn.execute(
        "INSERT INTO recipes (id, name, servings, created_at) VALUES ('r-zero', 'Rara', 0, 1000)"
    )
    db_conn.execute(
        """INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit)
           VALUES ('ri-zero', 'r-zero', 'Sal', 1.0, 'g')"""
    )
    db_conn.commit()

    # servings legacy a 0: escala 1.0, sin ZeroDivisionError
    added = crud.add_recipe_to_list(
        db_conn, "r-zero", AddRecipeToListRequest(listId="default", servings=4)
    )
    assert len(added) == 1
    assert added[0].quantity == 1.0


def test_default_db_path_is_repo_anchored():
    default = db_module._default_db_file()
    assert os.path.isabs(default)
    assert default.endswith("mercadona.db")
    # No depende del CWD: vive junto al repo, no en backend/
    assert os.path.dirname(default) == os.path.abspath(
        os.path.join(os.path.dirname(db_module.__file__), "..", "..")
    )
    assert db_module._resolve_db_path("sqlite:///./mercadona.db") == "./mercadona.db"
    assert db_module._resolve_db_path("sqlite:///C:/data/x.db") == "C:/data/x.db"
