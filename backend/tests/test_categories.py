def test_get_categories(client):
    response = client.get("/api/categories")
    assert response.status_code == 200
    cats = response.json()
    assert isinstance(cats, list)
    assert len(cats) >= 10

    # Verify category structure
    first = cats[0]
    assert "id" in first
    assert "name" in first
    assert "emoji" in first
    assert "color" in first
    assert "order" in first

    # Verify key categories exist
    category_ids = [c["id"] for c in cats]
    assert "fruta-verdura" in category_ids
    assert "lacteos-huevos" in category_ids
    assert "limpieza" in category_ids
    assert "perfumeria" in category_ids
    assert "mascotas" in category_ids
    assert "otros" in category_ids
