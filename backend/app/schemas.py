from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict, Field

BrandType = Literal['Hacendado', 'Bosque Verde', 'Deliplus', 'Compy', 'General']
UnitType = Literal['ud', 'kg', 'g', 'pack', 'litro', 'docena', 'bandeja']
PriorityType = Literal['baja', 'media', 'alta']

class ShoppingItemBase(BaseModel):
    name: str
    categoryId: str = Field(default="otros", alias="categoryId")
    brand: BrandType = Field(default="General")
    quantity: float = Field(default=1.0)
    unit: UnitType = Field(default="ud")
    estimatedPrice: Optional[float] = Field(default=None, alias="estimatedPrice")
    notes: Optional[str] = None
    priority: PriorityType = Field(default="media")

    model_config = ConfigDict(populate_by_name=True)

class ShoppingItemCreate(ShoppingItemBase):
    pass

class ShoppingItemUpdate(BaseModel):
    name: Optional[str] = None
    categoryId: Optional[str] = Field(default=None, alias="categoryId")
    brand: Optional[BrandType] = None
    quantity: Optional[float] = None
    unit: Optional[UnitType] = None
    estimatedPrice: Optional[float] = Field(default=None, alias="estimatedPrice")
    notes: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[PriorityType] = None

    model_config = ConfigDict(populate_by_name=True)

class ShoppingItemResponse(ShoppingItemBase):
    id: str
    completed: bool
    createdAt: int = Field(alias="createdAt")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class CategoryResponse(BaseModel):
    id: str
    name: str
    emoji: str
    color: str
    order: int
    description: Optional[str] = None

class CatalogProductResponse(BaseModel):
    id: str
    name: str
    categoryId: str = Field(alias="categoryId")
    brand: BrandType
    defaultUnit: UnitType = Field(alias="defaultUnit")
    typicalPrice: float = Field(alias="typicalPrice")
    popular: Optional[bool] = False

    model_config = ConfigDict(populate_by_name=True)

class BudgetStatsResponse(BaseModel):
    totalItems: int
    completedItems: int
    pendingItems: int
    totalEstimated: float
    pendingEstimated: float
    completedEstimated: float
    progressPercentage: int

class ShareTextResponse(BaseModel):
    shareText: str
