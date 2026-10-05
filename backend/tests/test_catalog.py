def test_get_catalog_all(client):
    response = client.get("/api/catalog")
    assert response.status_code == 200
    products = response.json()
    assert len(products) > 0
    item = products[0]
    assert "id" in item
    assert "name" in item
    assert "categoryId" in item
    assert "brand" in item
    assert "defaultUnit" in item
    assert "typicalPrice" in item

def test_get_catalog_popular_only(client):
    response = client.get("/api/catalog?popular_only=true")
    assert response.status_code == 200
    products = response.json()
    assert len(products) > 0
    assert all(p.get("popular") is True for p in products)

def test_get_catalog_filter_category(client):
    response = client.get("/api/catalog?category_id=fruta-verdura")
    assert response.status_code == 200
    products = response.json()
    assert len(products) > 0
    assert all(p["categoryId"] == "fruta-verdura" for p in products)

def test_get_catalog_search(client):
    response = client.get("/api/catalog?search=hummus")
    assert response.status_code == 200
    products = response.json()
    assert len(products) > 0
    assert any("hummus" in p["name"].lower() for p in products)

def test_get_catalog_empty_search(client):
    response = client.get("/api/catalog?search=producto_inexistente_xyz_123")
    assert response.status_code == 200
    products = response.json()
    assert len(products) == 0
