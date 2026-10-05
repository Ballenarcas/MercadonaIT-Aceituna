export type Brand = 'Hacendado' | 'Bosque Verde' | 'Deliplus' | 'Compy' | 'General';

export type Unit = 'ud' | 'kg' | 'g' | 'pack' | 'litro' | 'docena' | 'bandeja';

export type Priority = 'baja' | 'media' | 'alta';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  order: number; // Orden de recorrido típico en tienda Mercadona
  description?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  emoji: string;
  color: string;
  itemCount: number;
  cartCount: number;
  totalEstimated: number;
  cartEstimated: number;
  createdAt: number;
}

export interface ShoppingItem {
  id: string;
  listId: string;
  name: string;
  categoryId: string;
  brand: Brand;
  quantity: number;
  unit: Unit;
  estimatedPrice?: number; // Precio unitario estimado en €
  notes?: string;
  completed: boolean;
  inCart: boolean; // Si ya está introducido físicamente en el carrito
  priority: Priority;
  isFavorite?: boolean;
  createdAt: number;
}

export interface CatalogProduct {
  id: string;
  name: string;
  categoryId: string;
  brand: Brand;
  defaultUnit: Unit;
  typicalPrice: number;
  popular?: boolean;
}

// ── Recipes ───────────────────────────────────────────────────────────────────

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  name: string;
  quantity: number;
  unit: Unit;
  categoryId: string;
  estimatedPrice?: number;
  isOptional: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  category: string;
  servings: number;
  prepTimeMin: number;
  imageEmoji: string;
  tags: string;
  ingredients: RecipeIngredient[];
  createdAt: number;
}

export type RecipeCategory = 'all' | 'desayuno' | 'comida' | 'cena' | 'postre' | 'snack' | 'general';

// ── AI Chat ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  addedIngredients?: string[];
  suggestedRecipes?: string[];
}

// ── UI State ──────────────────────────────────────────────────────────────────

export type SortOption = 'aisle' | 'name' | 'price-asc' | 'price-desc' | 'created';
export type FilterStatus = 'all' | 'pending' | 'completed';
export type ActiveTab = 'lists' | 'list' | 'cart' | 'recipes';
