def test_get_lists(client):
    response = client.get("/api/lists")
    assert response.status_code == 200
    lists = response.json()
    assert len(lists) >= 2
    assert any(l["id"] == "default" for l in lists)

def test_create_list(client):
    payload = {"name": "Fiesta Cumpleaños", "emoji": "🎉", "color": "#8b5cf6"}
    response = client.post("/api/lists", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Fiesta Cumpleaños"
    assert data["emoji"] == "🎉"
    assert data["color"] == "#8b5cf6"
    assert data["id"].startswith("list_")
    assert data["itemCount"] == 0

def test_get_single_list(client):
    response = client.get("/api/lists/default")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "default"
    assert data["name"] == "Compra Principal"

def test_get_nonexistent_list(client):
    response = client.get("/api/lists/list_does_not_exist")
    assert response.status_code == 404
    assert response.json()["detail"] == "Lista no encontrada"

def test_update_list(client):
    payload = {"name": "Compra Principal Actualizada", "emoji": "🥑"}
    response = client.put("/api/lists/default", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Compra Principal Actualizada"
    assert data["emoji"] == "🥑"

def test_update_nonexistent_list(client):
    response = client.put("/api/lists/nonexistent", json={"name": "Test"})
    assert response.status_code == 404

def test_delete_list(client):
    # Delete secondary list
    response = client.delete("/api/lists/list-barbacoa")
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verify it is deleted
    get_res = client.get("/api/lists/list-barbacoa")
    assert get_res.status_code == 404

def test_delete_nonexistent_list(client):
    response = client.delete("/api/lists/list_invalid_999")
    assert response.status_code == 404

def test_delete_only_active_list_protection(client):
    # Delete list-barbacoa first so only default remains
    client.delete("/api/lists/list-barbacoa")
    
    # Try deleting the only remaining default list
    response = client.delete("/api/lists/default")
    assert response.status_code == 400
    assert "No puedes eliminar la única lista activa" in response.json()["detail"]

def test_list_stats_and_cart_actions(client):
    # Add an item to default list
    item_payload = {
        "name": "Pan rústico",
        "listId": "default",
        "categoryId": "horno-pan",
        "brand": "Hacendado",
        "quantity": 2,
        "unit": "ud",
        "estimatedPrice": 1.50,
        "priority": "media"
    }
    create_res = client.post("/api/items", json=item_payload)
    assert create_res.status_code == 201
    
    # Check stats for default list
    stats_res = client.get("/api/lists/default/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["totalItems"] == 1
    assert stats["listItemsCount"] == 1
    assert stats["cartItemsCount"] == 0
    assert stats["totalEstimated"] == 3.0
    assert stats["listEstimated"] == 3.0
    assert stats["cartEstimated"] == 0.0

    # Move all to cart
    move_res = client.post("/api/lists/default/move-all-to-cart")
    assert move_res.status_code == 200
    assert move_res.json()["count"] == 1

    # Verify stats updated
    stats_res2 = client.get("/api/lists/default/stats")
    stats2 = stats_res2.json()
    assert stats2["cartItemsCount"] == 1
    assert stats2["listItemsCount"] == 0
    assert stats2["cartEstimated"] == 3.0

    # Clear list cart
    clear_res = client.delete("/api/lists/default/cart")
    assert clear_res.status_code == 200
    assert clear_res.json()["count"] == 1

    # Verify list is now empty
    stats_res3 = client.get("/api/lists/default/stats")
    assert stats_res3.json()["totalItems"] == 0
