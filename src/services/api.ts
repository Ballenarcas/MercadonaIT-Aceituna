import type { ShoppingItem, Category, CatalogProduct, SortOption, ShoppingList, Recipe, ChatMessage } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = {
  async isBackendAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL.replace('/api', '')}/`, { method: 'GET', signal: AbortSignal.timeout(1500) });
      return res.ok;
    } catch {
      return false;
    }
  },

  // ── LISTS ──────────────────────────────────────────────────────────────────
  async getLists(): Promise<ShoppingList[]> {
    const res = await fetch(`${API_BASE_URL}/lists`);
    if (!res.ok) throw new Error(`Error al obtener listas: ${res.statusText}`);
    return res.json();
  },

  async createList(list: { name: string; emoji?: string; color?: string }): Promise<ShoppingList> {
    const res = await fetch(`${API_BASE_URL}/lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list),
    });
    if (!res.ok) throw new Error(`Error al crear lista: ${res.statusText}`);
    return res.json();
  },

  async updateList(id: string, updates: Partial<ShoppingList>): Promise<ShoppingList> {
    const res = await fetch(`${API_BASE_URL}/lists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(`Error al actualizar lista: ${res.statusText}`);
    return res.json();
  },

  async deleteList(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/lists/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Error al eliminar lista: ${res.statusText}`);
  },

  async getListJson(listId: string): Promise<object> {
    const res = await fetch(`${API_BASE_URL}/lists/${listId}/json`);
    if (!res.ok) throw new Error(`Error al obtener JSON de lista: ${res.statusText}`);
    return res.json();
  },

  // ── ITEMS ──────────────────────────────────────────────────────────────────
  async getItems(params?: {
    listId?: string;
    inCart?: boolean;
    categoryId?: string;
    completed?: boolean;
    search?: string;
    sortBy?: SortOption;
  }): Promise<ShoppingItem[]> {
    const searchParams = new URLSearchParams();
    if (params?.listId && params.listId !== 'all') {
      searchParams.append('list_id', params.listId);
    }
    if (params?.inCart !== undefined) {
      searchParams.append('in_cart', String(params.inCart));
    }
    if (params?.categoryId && params.categoryId !== 'all') {
      searchParams.append('category_id', params.categoryId);
    }
    if (params?.completed !== undefined) {
      searchParams.append('completed', String(params.completed));
    }
    if (params?.search) {
      searchParams.append('search', params.search);
    }
    if (params?.sortBy) {
      searchParams.append('sort_by', params.sortBy);
    }

    const res = await fetch(`${API_BASE_URL}/items?${searchParams.toString()}`);
    if (!res.ok) throw new Error(`Error al obtener artículos: ${res.statusText}`);
    return res.json();
  },

  async createItem(item: Omit<ShoppingItem, 'id' | 'createdAt' | 'completed' | 'inCart'>): Promise<ShoppingItem> {
    const res = await fetch(`${API_BASE_URL}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error(`Error al crear artículo: ${res.statusText}`);
    return res.json();
  },

  async updateItem(id: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem> {
    const res = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(`Error al actualizar artículo: ${res.statusText}`);
    return res.json();
  },

  async toggleCart(id: string): Promise<ShoppingItem> {
    const res = await fetch(`${API_BASE_URL}/items/${id}/toggle-cart`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error(`Error al mover artículo: ${res.statusText}`);
    return res.json();
  },

  async toggleItem(id: string): Promise<ShoppingItem> {
    return this.toggleCart(id);
  },

  async deleteItem(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Error al eliminar artículo: ${res.statusText}`);
  },

  async clearCompleted(listId?: string): Promise<void> {
    const url = listId ? `${API_BASE_URL}/items/completed?list_id=${listId}` : `${API_BASE_URL}/items/completed`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Error al limpiar completados: ${res.statusText}`);
  },

  async clearCart(listId?: string): Promise<void> {
    const url = listId ? `${API_BASE_URL}/lists/${listId}/cart` : `${API_BASE_URL}/items/completed`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Error al vaciar carrito: ${res.statusText}`);
  },

  async moveAllToCart(listId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/lists/${listId}/move-all-to-cart`, { method: 'POST' });
    if (!res.ok) throw new Error(`Error al mover todo al carrito: ${res.statusText}`);
  },

  async resetSample(listId?: string): Promise<ShoppingItem[]> {
    const url = listId ? `${API_BASE_URL}/items/reset-sample?list_id=${listId}` : `${API_BASE_URL}/items/reset-sample`;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error(`Error al restaurar ejemplos: ${res.statusText}`);
    return res.json();
  },

  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE_URL}/categories`);
    if (!res.ok) throw new Error(`Error al obtener categorías: ${res.statusText}`);
    return res.json();
  },

  async getCatalog(search?: string, categoryId?: string): Promise<CatalogProduct[]> {
    const searchParams = new URLSearchParams();
    if (search) searchParams.append('search', search);
    if (categoryId && categoryId !== 'all') searchParams.append('category_id', categoryId);

    const res = await fetch(`${API_BASE_URL}/catalog?${searchParams.toString()}`);
    if (!res.ok) throw new Error(`Error al obtener catálogo: ${res.statusText}`);
    return res.json();
  },

  async getShareText(listId?: string): Promise<string> {
    const url = listId ? `${API_BASE_URL}/items/share-text?list_id=${listId}` : `${API_BASE_URL}/items/share-text`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error al generar texto: ${res.statusText}`);
    const data = await res.json();
    return data.shareText;
  },

  // ── RECIPES ────────────────────────────────────────────────────────────────
  async getRecipes(params?: { search?: string; category?: string }): Promise<Recipe[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.category && params.category !== 'all') searchParams.append('category', params.category);
    const res = await fetch(`${API_BASE_URL}/recipes?${searchParams.toString()}`);
    if (!res.ok) throw new Error(`Error al obtener recetas: ${res.statusText}`);
    return res.json();
  },

  async getRecipe(id: string): Promise<Recipe> {
    const res = await fetch(`${API_BASE_URL}/recipes/${id}`);
    if (!res.ok) throw new Error(`Receta no encontrada`);
    return res.json();
  },

  async createRecipe(recipe: Omit<Recipe, 'id' | 'createdAt'>): Promise<Recipe> {
    const res = await fetch(`${API_BASE_URL}/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe),
    });
    if (!res.ok) throw new Error(`Error al crear receta: ${res.statusText}`);
    return res.json();
  },

  async updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe> {
    const res = await fetch(`${API_BASE_URL}/recipes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(`Error al actualizar receta: ${res.statusText}`);
    return res.json();
  },

  async deleteRecipe(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/recipes/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Error al eliminar receta: ${res.statusText}`);
  },

  async addRecipeToList(
    recipeId: string,
    opts: { listId: string; servings?: number; skipOptional?: boolean },
  ): Promise<ShoppingItem[]> {
    const res = await fetch(`${API_BASE_URL}/recipes/${recipeId}/add-to-list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listId: opts.listId, servings: opts.servings, skipOptional: opts.skipOptional ?? false }),
    });
    if (!res.ok) throw new Error(`Error al añadir receta a lista: ${res.statusText}`);
    return res.json();
  },

  async searchRecipesByIngredients(ingredients: string[]): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/recipes/search-by-ingredients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients }),
    });
    if (!res.ok) throw new Error(`Error al buscar recetas: ${res.statusText}`);
    return res.json();
  },

  async getMissingIngredients(recipe: string, userIngredients?: string[]): Promise<{ recipeName: string; missingIngredients: any[] }> {
    const res = await fetch(`${API_BASE_URL}/recipes/missing-ingredients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipe, userIngredients }),
    });
    if (!res.ok) throw new Error(`Error al obtener ingredientes faltantes: ${res.statusText}`);
    return res.json();
  },

  async createItemsBatch(
    listId: string,
    items: Partial<ShoppingItem>[],
  ): Promise<ShoppingItem[]> {
    const res = await fetch(`${API_BASE_URL}/items/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listId, items }),
    });
    if (!res.ok) throw new Error(`Error al añadir artículos: ${res.statusText}`);
    return res.json();
  },

  // ── AI CHAT ────────────────────────────────────────────────────────────────
  async sendChatMessage(
    message: string,
    listId: string,
    history: ChatMessage[],
  ): Promise<{
    reply: string;
    addedIngredients: string[];
    suggestedRecipes: string[];
    recipeSuggestions?: any[];
    missingIngredients?: any[];
    recipeName?: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, listId, history }),
    });
    if (!res.ok) throw new Error(`Error en el chat: ${res.statusText}`);
    return res.json();
  },
};
