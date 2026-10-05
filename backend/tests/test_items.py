def test_item_lifecycle(client):
    # 1. Create item
    item_payload = {
        "name": "Leche Entera Hacendado",
        "listId": "default",
        "categoryId": "lacteos-huevos",
        "brand": "Hacendado",
        "quantity": 6,
        "unit": "litro",
        "estimatedPrice": 0.95,
        "notes": "Pack 6 briks",
        "priority": "alta"
    }
    create_res = client.post("/api/items", json=item_payload)
    assert create_res.status_code == 201
    item = create_res.json()
    assert item["name"] == "Leche Entera Hacendado"
    assert item["inCart"] is False
    assert item["completed"] is False
    assert item["quantity"] == 6.0
    item_id = item["id"]

    # 2. Get item by id
    get_res = client.get(f"/api/items/{item_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == item_id

    # 3. Update item
    update_payload = {"quantity": 12, "notes": "Comprar 2 packs"}
    update_res = client.put(f"/api/items/{item_id}", json=update_payload)
    assert update_res.status_code == 200
    assert update_res.json()["quantity"] == 12.0
    assert update_res.json()["notes"] == "Comprar 2 packs"

    # 4. Toggle cart
    toggle_res = client.patch(f"/api/items/{item_id}/toggle-cart")
    assert toggle_res.status_code == 200
    assert toggle_res.json()["inCart"] is True
    assert toggle_res.json()["completed"] is True

    # 5. Toggle cart back
    toggle_back_res = client.patch(f"/api/items/{item_id}/toggle")
    assert toggle_back_res.status_code == 200
    assert toggle_back_res.json()["inCart"] is False

    # 6. Delete item
    del_res = client.delete(f"/api/items/{item_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 7. Check 404 after deletion
    get_del_res = client.get(f"/api/items/{item_id}")
    assert get_del_res.status_code == 404

def test_items_filtering_and_sorting(client):
    # Seed samples
    reset_res = client.post("/api/items/reset-sample?list_id=default")
    assert reset_res.status_code == 200
    assert len(reset_res.json()) > 0

    # Filter by category
    cat_res = client.get("/api/items?category_id=fruta-verdura")
    assert cat_res.status_code == 200
    for it in cat_res.json():
        assert it["categoryId"] == "fruta-verdura"

    # Filter by search
    search_res = client.get("/api/items?search=hacendado")
    assert search_res.status_code == 200
    for it in search_res.json():
        assert "hacendado" in it["name"].lower() or "hacendado" in it["brand"].lower() or (it["notes"] and "hacendado" in it["notes"].lower())

    # Sort by price asc
    price_asc_res = client.get("/api/items?sort_by=price-asc")
    assert price_asc_res.status_code == 200
    prices = [i["estimatedPrice"] or 0.0 for i in price_asc_res.json() if not i["inCart"]]
    assert prices == sorted(prices)

    # Sort by name
    name_res = client.get("/api/items?sort_by=name")
    assert name_res.status_code == 200
    names = [i["name"].lower() for i in name_res.json() if not i["inCart"]]
    assert names == sorted(names)

def test_share_text_and_stats(client):
    client.post("/api/items/reset-sample?list_id=default")
    
    # Check stats
    stats_res = client.get("/api/items/stats?list_id=default")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["totalItems"] > 0
    assert "cartEstimated" in stats
    assert "totalEstimated" in stats
    assert "progressPercentage" in stats

    # Check share text
    share_res = client.get("/api/items/share-text?list_id=default")
    assert share_res.status_code == 200
    share_data = share_res.json()
    assert "COMPRA MERCADONA" in share_data["shareText"]
    assert "Presupuesto Total Estimado" in share_data["shareText"]

def test_delete_completed_and_clear_all(client):
    client.post("/api/items/reset-sample?list_id=default")
    
    # Delete completed
    del_comp_res = client.delete("/api/items/completed?list_id=default")
    assert del_comp_res.status_code == 200
    assert "deletedCount" in del_comp_res.json()

    # Clear all items
    clear_all_res = client.delete("/api/items/all")
    assert clear_all_res.status_code == 200
    assert "deletedCount" in clear_all_res.json()

    # Confirm 0 items remain
    all_res = client.get("/api/items")
    assert len(all_res.json()) == 0
