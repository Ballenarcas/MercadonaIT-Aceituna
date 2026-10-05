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

export interface ShoppingItem {
  id: string;
  name: string;
  categoryId: string;
  brand: Brand;
  quantity: number;
  unit: Unit;
  estimatedPrice?: number; // Precio unitario estimado en €
  notes?: string;
  completed: boolean;
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

export type SortOption = 'aisle' | 'name' | 'price-asc' | 'price-desc' | 'created';
export type FilterStatus = 'all' | 'pending' | 'completed';
