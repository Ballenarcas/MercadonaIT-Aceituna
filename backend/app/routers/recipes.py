from fastapi import APIRouter, Depends, HTTPException
import sqlite3
from typing import List, Optional
from ..database import get_db
from ..schemas import (
    RecipeCreate,
    RecipeUpdate,
    RecipeResponse,
    AddRecipeToListRequest,
    ShoppingItemResponse,
    SearchByIngredientsRequest,
    RecipeSuggestionItem,
    MissingIngredientsRequest,
    MissingIngredientsResponse,
    MissingIngredientItem,
)
from ..fuzzy_service import search_recipes_by_ingredients, search_recipe_by_name
from .. import crud

router = APIRouter(prefix="/recipes", tags=["Recipes"])


@router.get("", response_model=List[RecipeResponse])
def list_recipes(
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: sqlite3.Connection = Depends(get_db),
):
    """List all recipes, optionally filtered by search or category."""
    return crud.get_recipes(db, search=search, category=category)


@router.post("", response_model=RecipeResponse, status_code=201)
def create_recipe(recipe: RecipeCreate, db: sqlite3.Connection = Depends(get_db)):
    """Create a new recipe with its ingredients."""
    return crud.create_recipe(db, recipe)


@router.get("/{recipe_id}", response_model=RecipeResponse)
def get_recipe(recipe_id: str, db: sqlite3.Connection = Depends(get_db)):
    """Get a single recipe by ID."""
    recipe = crud.get_recipe(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    return recipe


@router.put("/{recipe_id}", response_model=RecipeResponse)
def update_recipe(recipe_id: str, recipe: RecipeUpdate, db: sqlite3.Connection = Depends(get_db)):
    """Update recipe metadata (not ingredients)."""
    updated = crud.update_recipe(db, recipe_id, recipe)
    if not updated:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    return updated


@router.delete("/{recipe_id}", status_code=204)
def delete_recipe(recipe_id: str, db: sqlite3.Connection = Depends(get_db)):
    """Delete a recipe and all its ingredients."""
    if not crud.delete_recipe(db, recipe_id):
        raise HTTPException(status_code=404, detail="Receta no encontrada")


@router.post("/{recipe_id}/add-to-list", response_model=List[ShoppingItemResponse])
def add_recipe_to_list(
    recipe_id: str,
    req: AddRecipeToListRequest,
    db: sqlite3.Connection = Depends(get_db),
):
    """Add all ingredients of a recipe to a shopping list."""
    recipe = crud.get_recipe(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    added = crud.add_recipe_to_list(db, recipe_id, req)
    return added


@router.post("/search-by-ingredients", response_model=List[RecipeSuggestionItem])
def search_by_ingredients(
    req: SearchByIngredientsRequest,
    db: sqlite3.Connection = Depends(get_db),
):
    """Buscar recetas en la base de datos a partir de ingredientes usando fuzzy matching con thefuzz."""
    results = search_recipes_by_ingredients(req.ingredients, db)
    return [
        RecipeSuggestionItem(
            id=r["id"],
            name=r["name"],
            imageEmoji=r["imageEmoji"],
            matchScore=r["matchScore"],
            matchedIngredients=r["matchedIngredients"],
            missingCount=r["missingCount"],
        )
        for r in results
    ]


@router.post("/missing-ingredients", response_model=MissingIngredientsResponse)
def get_missing_ingredients(
    req: MissingIngredientsRequest,
    db: sqlite3.Connection = Depends(get_db),
):
    """Obtener los ingredientes faltantes de una receta usando fuzzy matching con thefuzz."""
    matched = search_recipe_by_name(req.recipe, db, user_ingredients=req.userIngredients)
    if not matched:
        raise HTTPException(status_code=404, detail="No se encontró una receta coincidente en la base de datos")
    
    missing = [
        MissingIngredientItem(
            name=m["name"],
            quantity=m.get("quantity", 1.0),
            unit=m.get("unit", "ud"),
            categoryId=m.get("categoryId", "otros"),
            brand=m.get("brand", "Hacendado"),
            estimatedPrice=m.get("estimatedPrice"),
            notes=f"De receta: {matched['name']}",
            inCart=False,
        )
        for m in matched.get("missingIngredients", [])
    ]
    return MissingIngredientsResponse(recipeName=matched["name"], missingIngredients=missing)
