from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_lists():
    response = client.get("/api/lists")
    assert response.status_code == 200
    lists = response.json()
    assert len(lists) >= 1

    # Create a new list
    new_list_data = {"name": "Cena de Tacos", "emoji": "🌮", "color": "#f59e0b"}
    res_create = client.post("/api/lists", json=new_list_data)
    assert res_create.status_code == 201
    created_list = res_create.json()
    assert created_list["name"] == "Cena de Tacos"

def test_categories():
    response = client.get("/api/categories")
    assert response.status_code == 200
    cats = response.json()
    assert len(cats) >= 10
    assert any(c["id"] == "fruta-verdura" for c in cats)

def test_catalog():
    response = client.get("/api/catalog")
    assert response.status_code == 200
    products = response.json()
    assert len(products) > 0
    assert any("Hummus" in p["name"] for p in products)

def test_shopping_items_flow():
    # 1. Reset sample items
    res_reset = client.post("/api/items/reset-sample?list_id=default")
    assert res_reset.status_code == 200
    items = res_reset.json()
    assert len(items) > 0

    # 2. Add new item to list
    new_item_data = {
        "name": "Aceitunas Rellenas Hacendado",
        "listId": "default",
        "categoryId": "aperitivos-dulces",
        "brand": "Hacendado",
        "quantity": 3,
        "unit": "ud",
        "estimatedPrice": 1.20,
        "notes": "Lata triple",
        "priority": "alta"
    }
    res_create = client.post("/api/items", json=new_item_data)
    assert res_create.status_code == 201
    created_item = res_create.json()
    assert created_item["name"] == "Aceitunas Rellenas Hacendado"
    assert created_item["inCart"] is False
    item_id = created_item["id"]

    # 3. Move to cart via toggle-cart
    res_cart = client.patch(f"/api/items/{item_id}/toggle-cart")
    assert res_cart.status_code == 200
    assert res_cart.json()["inCart"] is True

    # 4. Check stats
    res_stats = client.get("/api/items/stats?list_id=default")
    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert stats["totalItems"] >= 1
    assert stats["cartItemsCount"] >= 1

    # 5. Delete item
    res_del = client.delete(f"/api/items/{item_id}")
    assert res_del.status_code == 200

if __name__ == "__main__":
    print("Testing health check...")
    test_health()
    print("Testing lists...")
    test_lists()
    print("Testing categories...")
    test_categories()
    print("Testing catalog...")
    test_catalog()
    print("Testing shopping items and cart flow...")
    test_shopping_items_flow()
    print("[SUCCESS] All FastAPI backend tests passed successfully!")
