def test_health_check(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "app" in data
    assert "version" in data
    assert data["docs"] == "/docs"
