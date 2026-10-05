import pytest
from app.main import app

def test_recipes_search_by_ingredients(client):
    res = client.post("/api/recipes/search-by-ingredients", json={"ingredients": ["arroz", "tomate"]})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "name" in data[0]
    assert data[0]["matchScore"] > 0

def test_recipes_missing_ingredients(client):
    res = client.post(
        "/api/recipes/missing-ingredients",
        json={"recipe": "Macarrones a la boloñesa", "userIngredients": ["Macarrones Hacendado"]}
    )
    assert res.status_code == 200
    data = res.json()
    assert "recipeName" in data
    assert "missingIngredients" in data
    assert len(data["missingIngredients"]) > 0
    names = [m["name"].lower() for m in data["missingIngredients"]]
    assert not any("macarrones" in n for n in names)
    assert any("tomate" in n or "carne" in n for n in names)

def test_chat_with_ingredients(client):
    res = client.post("/api/chat", json={"message": "Tengo arroz, tomate y huevos", "listId": "default"})
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert len(data.get("recipeSuggestions", [])) > 0 or len(data.get("suggestedRecipes", [])) > 0

def test_chat_with_recipe_name(client):
    res = client.post("/api/chat", json={"message": "Macarrones a la boloñesa", "listId": "default"})
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert data.get("recipeName") == "Macarrones a la boloñesa"
    assert len(data.get("missingIngredients", [])) >= 4
    item = data["missingIngredients"][0]
    assert "name" in item
    assert "quantity" in item
    assert item["inCart"] is False

def test_chat_off_topic_message(client):
    res = client.post("/api/chat", json={"message": "Escribe un script en python para compilar código", "listId": "default"})
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert "cocina" in data["reply"].lower() or "mercadona" in data["reply"].lower()
    # It should not suggest recipes or return missing ingredients for off-topic requests
    assert len(data.get("recipeSuggestions", [])) == 0
    assert len(data.get("missingIngredients", [])) == 0
    assert data.get("recipeName") is None

def test_batch_create_items(client):
    payload = {
        "listId": "default",
        "items": [
            {
                "name": "Aceite de Oliva Virgen Extra",
                "categoryId": "despensa-conservas",
                "quantity": 1.0,
                "unit": "litro",
                "estimatedPrice": 8.95,
                "inCart": True,
            },
            {
                "name": "Sal fina",
                "categoryId": "despensa-conservas",
                "quantity": 1.0,
                "unit": "ud",
                "estimatedPrice": 0.35,
                "inCart": True,
            }
        ]
    }
    res = client.post("/api/items/batch", json=payload)
    assert res.status_code == 201
    items = res.json()
    assert len(items) == 2
    assert items[0]["inCart"] is True
    assert items[1]["inCart"] is True
