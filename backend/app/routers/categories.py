from typing import List
from fastapi import APIRouter
from ..schemas import CategoryResponse
from ..initial_data import MERCADONA_CATEGORIES

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryResponse])
def get_categories():
    """Obtener todas las categorías y orden de pasillos de Mercadona."""
    return [CategoryResponse(**c) for c in MERCADONA_CATEGORIES]
