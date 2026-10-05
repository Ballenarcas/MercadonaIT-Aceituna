from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict, Field

BrandType = Literal['Hacendado', 'Bosque Verde', 'Deliplus', 'Compy', 'General']
UnitType = Literal['ud', 'kg', 'g', 'pack', 'litro', 'docena', 'bandeja']
PriorityType = Literal['baja', 'media', 'alta']

# Shopping Lists
class ShoppingListBase(BaseModel):
    name: str
    emoji: str = Field(default="🛒")
    color: str = Field(default="#059669")

class ShoppingListCreate(ShoppingListBase):
    pass

class ShoppingListUpdate(BaseModel):
    name: Optional[str] = None
    emoji: Optional[str] = None
    color: Optional[str] = None
    isArchived: Optional[bool] = Field(default=None, alias="isArchived")

    model_config = ConfigDict(populate_by_name=True)

class ShoppingListResponse(ShoppingListBase):
    id: str
    itemCount: int = Field(default=0, alias="itemCount")
    cartCount: int = Field(default=0, alias="cartCount")
    totalEstimated: float = Field(default=0.0, alias="totalEstimated")
    cartEstimated: float = Field(default=0.0, alias="cartEstimated")
    createdAt: int = Field(alias="createdAt")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

# Shopping Items
class ShoppingItemBase(BaseModel):
    name: str
    listId: str = Field(default="default", alias="listId")
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
    listId: Optional[str] = Field(default=None, alias="listId")
    categoryId: Optional[str] = Field(default=None, alias="categoryId")
    brand: Optional[BrandType] = None
    quantity: Optional[float] = None
    unit: Optional[UnitType] = None
    estimatedPrice: Optional[float] = Field(default=None, alias="estimatedPrice")
    notes: Optional[str] = None
    completed: Optional[bool] = None
    inCart: Optional[bool] = Field(default=None, alias="inCart")
    priority: Optional[PriorityType] = None

    model_config = ConfigDict(populate_by_name=True)

class ShoppingItemResponse(ShoppingItemBase):
    id: str
    completed: bool
    inCart: bool = Field(default=False, alias="inCart")
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
    listItemsCount: int       # Items in list (pending to be put in cart)
    cartItemsCount: int       # Items already inside the cart
    totalEstimated: float     # Total estimated cost
    listEstimated: float      # Cost of items remaining on list
    cartEstimated: float      # Cost of items currently inside cart
    progressPercentage: int   # % of list placed in cart

class ShareTextResponse(BaseModel):
    shareText: str
