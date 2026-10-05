import pytest
from app.fuzzy_service import (
    extract_ingredients,
    is_giving_ingredients,
    search_recipes_by_ingredients,
    search_recipe_by_name,
    get_recipes_from_db,
)

def test_extract_ingredients():
    text = "Tengo arroz, tomate frito y huevos camperos en la nevera"
    ings = extract_ingredients(text)
    assert any("arroz" in i.lower() for i in ings)
    assert any("tomate" in i.lower() for i in ings)
    assert any("huevo" in i.lower() for i in ings)

def test_is_giving_ingredients():
    assert is_giving_ingredients("Tengo arroz, tomate y huevos") is True
    assert is_giving_ingredients("arroz, huevos, pollo") is True
    assert is_giving_ingredients("Quiero hacer Macarrones a la boloñesa") is False
    assert is_giving_ingredients("receta de arroz a la cubana") is False

def test_search_recipes_by_ingredients(db_conn):
    results = search_recipes_by_ingredients(["arroz", "tomate"], db_conn)
    assert len(results) > 0
    top = results[0]
    assert "arroz" in top["name"].lower() or "cubana" in top["name"].lower()
    assert top["matchScore"] > 0
    assert len(top["missingIngredients"]) > 0

def test_search_recipe_by_name_exact_and_fuzzy(db_conn):
    match1 = search_recipe_by_name("boloñesa", db_conn)
    assert match1 is not None
    assert "macarrones" in match1["name"].lower()
    assert len(match1["missingIngredients"]) >= 4

    match2 = search_recipe_by_name("arroz a la cubana", db_conn)
    assert match2 is not None
    assert "arroz" in match2["name"].lower()

def test_search_recipe_missing_with_user_ingredients(db_conn):
    user_ings = ["arroz", "tomate", "huevos"]
    match = search_recipe_by_name("arroz a la cubana", db_conn, user_ingredients=user_ings)
    assert match is not None
    missing_names = [m["name"].lower() for m in match["missingIngredients"]]
    assert not any("arroz" in m for m in missing_names)
    assert not any("tomate" in m for m in missing_names)
    assert any("aceite" in m or "sal" in m for m in missing_names)
