import type { ShoppingItem, Category, CatalogProduct, SortOption } from '../types';

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

  async getItems(params?: {
    categoryId?: string;
    completed?: boolean;
    search?: string;
    sortBy?: SortOption;
  }): Promise<ShoppingItem[]> {
    const searchParams = new URLSearchParams();
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

  async createItem(item: Omit<ShoppingItem, 'id' | 'createdAt' | 'completed'>): Promise<ShoppingItem> {
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

  async toggleItem(id: string): Promise<ShoppingItem> {
    const res = await fetch(`${API_BASE_URL}/items/${id}/toggle`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error(`Error al alternar estado: ${res.statusText}`);
    return res.json();
  },

  async deleteItem(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Error al eliminar artículo: ${res.statusText}`);
  },

  async clearCompleted(): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/items/completed`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Error al limpiar completados: ${res.statusText}`);
  },

  async clearAll(): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/items/all`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Error al vaciar lista: ${res.statusText}`);
  },

  async resetSample(): Promise<ShoppingItem[]> {
    const res = await fetch(`${API_BASE_URL}/items/reset-sample`, {
      method: 'POST',
    });
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

  async getShareText(): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/items/share-text`);
    if (!res.ok) throw new Error(`Error al generar texto: ${res.statusText}`);
    const data = await res.json();
    return data.shareText;
  },
};
