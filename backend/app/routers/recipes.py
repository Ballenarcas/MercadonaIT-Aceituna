from fastapi import APIRouter, Depends, HTTPException
import sqlite3
from typing import List, Optional
from ..database import get_db
from ..schemas import RecipeCreate, RecipeUpdate, RecipeResponse, AddRecipeToListRequest, ShoppingItemResponse
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
