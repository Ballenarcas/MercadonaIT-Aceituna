import pytest
from app import crud
from app.schemas import ShoppingListCreate, ShoppingListUpdate, ShoppingItemCreate, ShoppingItemUpdate

def test_crud_direct_list_operations(db_conn):
    # Create list
    new_list = crud.create_list(db_conn, ShoppingListCreate(name="Pique Nique", emoji="🧺", color="#10b981"))
    assert new_list.name == "Pique Nique"
    assert new_list.emoji == "🧺"

    # Get list
    fetched = crud.get_list(db_conn, new_list.id)
    assert fetched is not None
    assert fetched.id == new_list.id

    # Update list
    updated = crud.update_list(db_conn, new_list.id, ShoppingListUpdate(name="Picnic en la Playa"))
    assert updated is not None
    assert updated.name == "Picnic en la Playa"

    # Delete list
    deleted = crud.delete_list(db_conn, new_list.id)
    assert deleted is True
    assert crud.get_list(db_conn, new_list.id) is None

def test_crud_direct_item_operations(db_conn):
    # Create item
    item_in = ShoppingItemCreate(
        name="Tortilla de Patatas",
        listId="default",
        categoryId="horno-pan",
        brand="Hacendado",
        quantity=1.0,
        unit="ud",
        estimatedPrice=3.50,
        priority="alta"
    )
    created = crud.create_item(db_conn, item_in)
    assert created.name == "Tortilla de Patatas"
    assert created.inCart is False

    # Toggle cart
    toggled = crud.toggle_cart_item(db_conn, created.id)
    assert toggled is not None
    assert toggled.inCart is True
    assert toggled.completed is True

    # Update item
    updated = crud.update_item(db_conn, created.id, ShoppingItemUpdate(quantity=2.0))
    assert updated is not None
    assert updated.quantity == 2.0

    # Stats
    stats = crud.calculate_stats(db_conn, list_id="default")
    assert stats.totalItems == 1
    assert stats.cartItemsCount == 1
    assert stats.cartEstimated == 7.0

    # Delete item
    assert crud.delete_item(db_conn, created.id) is True
    assert crud.get_item(db_conn, created.id) is None

def test_crud_edge_cases(db_conn):
    # Non existent updates and fetches
    assert crud.get_item(db_conn, "non_existent_id") is None
    assert crud.get_list(db_conn, "non_existent_id") is None
    assert crud.update_item(db_conn, "non_existent_id", ShoppingItemUpdate(name="x")) is None
    assert crud.update_list(db_conn, "non_existent_id", ShoppingListUpdate(name="x")) is None
    assert crud.toggle_cart_item(db_conn, "non_existent_id") is None

    # Empty stats
    stats = crud.calculate_stats(db_conn, list_id="empty_list")
    assert stats.totalItems == 0
    assert stats.progressPercentage == 0
    assert stats.totalEstimated == 0.0
