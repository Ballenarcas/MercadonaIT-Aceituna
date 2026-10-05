import pytest

def test_get_recipes_list(client):
    res = client.get("/api/recipes")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    names = [r["name"] for r in data]
    assert "Macarrones a la boloñesa" in names
    assert "Arroz a la cubana con huevo" in names

def test_get_single_recipe(client):
    res = client.get("/api/recipes/recipe_1")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "recipe_1"
    assert data["name"] == "Macarrones a la boloñesa"
    assert len(data["ingredients"]) > 0

def test_get_nonexistent_recipe(client):
    res = client.get("/api/recipes/nonexistent_123")
    assert res.status_code == 404

def test_create_and_delete_recipe(client):
    payload = {
        "name": "Tortilla española casera",
        "description": "Tortilla de patatas con cebolla tradicional.",
        "category": "cena",
        "servings": 4,
        "prepTimeMin": 30,
        "imageEmoji": "🍳",
        "tags": "huevo,patata,cena",
        "ingredients": [
            {
                "name": "Patatas selección",
                "quantity": 1.0,
                "unit": "kg",
                "categoryId": "fruta-verdura",
                "estimatedPrice": 1.50,
                "isOptional": False
            },
            {
                "name": "Huevos camperos",
                "quantity": 6.0,
                "unit": "ud",
                "categoryId": "lacteos-huevos",
                "estimatedPrice": 1.80,
                "isOptional": False
            }
        ]
    }
    # Create recipe
    create_res = client.post("/api/recipes", json=payload)
    assert create_res.status_code == 201
    created = create_res.json()
    recipe_id = created["id"]
    assert created["name"] == "Tortilla española casera"
    assert len(created["ingredients"]) == 2
    assert created["imageEmoji"] == "🍳"

    # Verify recipe is listed
    list_res = client.get("/api/recipes")
    assert any(r["id"] == recipe_id for r in list_res.json())

    # Update recipe
    update_payload = {
        "name": "Tortilla española con cebolla caramelizada",
        "servings": 6,
        "ingredients": [
            {
                "name": "Patatas selección",
                "quantity": 1.5,
                "unit": "kg",
                "categoryId": "fruta-verdura",
            },
            {
                "name": "Cebollas dulces",
                "quantity": 2.0,
                "unit": "ud",
                "categoryId": "fruta-verdura",
            },
            {
                "name": "Huevos camperos",
                "quantity": 8.0,
                "unit": "ud",
                "categoryId": "lacteos-huevos",
            }
        ]
    }
    update_res = client.put(f"/api/recipes/{recipe_id}", json=update_payload)
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["name"] == "Tortilla española con cebolla caramelizada"
    assert updated["servings"] == 6
    assert len(updated["ingredients"]) == 3

    # Add recipe to list
    add_res = client.post(f"/api/recipes/{recipe_id}/add-to-list", json={"listId": "default", "servings": 4})
    assert add_res.status_code == 200
    items_added = add_res.json()
    assert len(items_added) == 3

    # Delete recipe
    del_res = client.delete(f"/api/recipes/{recipe_id}")
    assert del_res.status_code == 204

    # Verify deleted
    get_res = client.get(f"/api/recipes/{recipe_id}")
    assert get_res.status_code == 404
