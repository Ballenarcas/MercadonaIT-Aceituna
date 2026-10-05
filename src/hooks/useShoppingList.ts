import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ShoppingItem, SortOption, FilterStatus, CatalogProduct } from '../types';
import { INITIAL_SAMPLE_ITEMS } from '../data/mercadonaCatalog';
import { getCategoryById } from '../data/categories';
import { api } from '../services/api';

const STORAGE_KEY = 'mercadona_shopping_list_v1';

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading shopping list from localStorage', e);
    }
    return INITIAL_SAMPLE_ITEMS;
  });

  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('aisle');

  // Check FastAPI backend availability and load initial items
  const checkBackendAndSync = useCallback(async () => {
    setIsLoading(true);
    const available = await api.isBackendAvailable();
    setIsBackendConnected(available);

    if (available) {
      try {
        const remoteItems = await api.getItems();
        setItems(remoteItems);
      } catch (e) {
        console.warn('FastAPI backend reachable but error fetching items, using local cache', e);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkBackendAndSync();
  }, [checkBackendAndSync]);

  // Persist to localStorage as backup
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }, [items]);

  const addItem = async (itemData: Omit<ShoppingItem, 'id' | 'createdAt' | 'completed'>) => {
    if (isBackendConnected) {
      try {
        const created = await api.createItem(itemData);
        setItems((prev) => [created, ...prev]);
        return;
      } catch (e) {
        console.error('Error creating item in FastAPI backend, adding locally', e);
      }
    }

    const newItem: ShoppingItem = {
      ...itemData,
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      completed: false,
      createdAt: Date.now(),
    };
    setItems((prev) => [newItem, ...prev]);
  };

  const addFromCatalog = async (product: CatalogProduct) => {
    const existingIndex = items.findIndex(
      (i) => i.name.toLowerCase() === product.name.toLowerCase() && !i.completed
    );

    if (existingIndex > -1) {
      const existing = items[existingIndex];
      const newQty = existing.quantity + 1;
      updateItem(existing.id, { quantity: newQty });
    } else {
      addItem({
        name: product.name,
        categoryId: product.categoryId,
        brand: product.brand,
        quantity: 1,
        unit: product.defaultUnit,
        estimatedPrice: product.typicalPrice,
        priority: 'media',
      });
    }
  };

  const toggleItem = async (id: string) => {
    // Optimistic local update
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );

    if (isBackendConnected) {
      try {
        await api.toggleItem(id);
      } catch (e) {
        console.error('Error toggling item on backend', e);
      }
    }
  };

  const updateItem = async (id: string, updates: Partial<ShoppingItem>) => {
    // Optimistic local update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );

    if (isBackendConnected) {
      try {
        await api.updateItem(id, updates);
      } catch (e) {
        console.error('Error updating item on backend', e);
      }
    }
  };

  const deleteItem = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));

    if (isBackendConnected) {
      try {
        await api.deleteItem(id);
      } catch (e) {
        console.error('Error deleting item on backend', e);
      }
    }
  };

  const clearCompleted = async () => {
    setItems((prev) => prev.filter((item) => !item.completed));

    if (isBackendConnected) {
      try {
        await api.clearCompleted();
      } catch (e) {
        console.error('Error clearing completed on backend', e);
      }
    }
  };

  const clearAll = async () => {
    setItems([]);

    if (isBackendConnected) {
      try {
        await api.clearAll();
      } catch (e) {
        console.error('Error clearing all on backend', e);
      }
    }
  };

  const resetToSample = async () => {
    if (isBackendConnected) {
      try {
        const resetItems = await api.resetSample();
        setItems(resetItems);
        return;
      } catch (e) {
        console.error('Error resetting samples on backend', e);
      }
    }
    setItems(INITIAL_SAMPLE_ITEMS);
  };

  const stats = useMemo(() => {
    const totalItems = items.length;
    const completedItems = items.filter((i) => i.completed).length;
    const pendingItems = totalItems - completedItems;

    let totalEstimated = 0;
    let pendingEstimated = 0;
    let completedEstimated = 0;

    items.forEach((item) => {
      const itemCost = (item.estimatedPrice || 0) * (item.quantity || 1);
      totalEstimated += itemCost;
      if (item.completed) {
        completedEstimated += itemCost;
      } else {
        pendingEstimated += itemCost;
      }
    });

    const progressPercentage = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

    return {
      totalItems,
      completedItems,
      pendingItems,
      totalEstimated,
      pendingEstimated,
      completedEstimated,
      progressPercentage,
    };
  }, [items]);

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter((item) => item.categoryId === selectedCategory);
    }

    if (filterStatus === 'pending') {
      result = result.filter((item) => !item.completed);
    } else if (filterStatus === 'completed') {
      result = result.filter((item) => item.completed);
    }

    result.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      switch (sortBy) {
        case 'aisle': {
          const catA = getCategoryById(a.categoryId);
          const catB = getCategoryById(b.categoryId);
          if (catA.order !== catB.order) {
            return catA.order - catB.order;
          }
          return a.name.localeCompare(b.name, 'es');
        }
        case 'name':
          return a.name.localeCompare(b.name, 'es');
        case 'price-asc':
          return (a.estimatedPrice || 0) - (b.estimatedPrice || 0);
        case 'price-desc':
          return (b.estimatedPrice || 0) - (a.estimatedPrice || 0);
        case 'created':
          return b.createdAt - a.createdAt;
        default:
          return 0;
      }
    });

    return result;
  }, [items, searchQuery, selectedCategory, filterStatus, sortBy]);

  const groupedByCategory = useMemo(() => {
    const groups: { [catId: string]: ShoppingItem[] } = {};

    filteredAndSortedItems.forEach((item) => {
      if (!groups[item.categoryId]) {
        groups[item.categoryId] = [];
      }
      groups[item.categoryId].push(item);
    });

    return Object.entries(groups)
      .map(([catId, catItems]) => ({
        category: getCategoryById(catId),
        items: catItems,
      }))
      .sort((a, b) => a.category.order - b.category.order);
  }, [filteredAndSortedItems]);

  const generateWhatsAppShareText = () => {
    const lines: string[] = ['🛒 *LISTA DE LA COMPRA MERCADONA* 🛒', ''];

    groupedByCategory.forEach(({ category, items }) => {
      lines.push(`${category.emoji} *${category.name.toUpperCase()}*`);
      items.forEach((item) => {
        const check = item.completed ? '✅' : '⬜';
        const price = item.estimatedPrice
          ? ` (~${(item.estimatedPrice * item.quantity).toFixed(2)}€)`
          : '';
        const note = item.notes ? ` _(${item.notes})_` : '';
        lines.push(`${check} ${item.name} (${item.quantity} ${item.unit})${price}${note}`);
      });
      lines.push('');
    });

    lines.push(`💰 *Total estimado:* ${stats.totalEstimated.toFixed(2)} €`);
    lines.push(`📦 *Artículos:* ${stats.completedItems}/${stats.totalItems} comprados`);

    return lines.join('\n');
  };

  return {
    items,
    filteredItems: filteredAndSortedItems,
    groupedByCategory,
    stats,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    isBackendConnected,
    isLoading,
    refreshBackend: checkBackendAndSync,
    addItem,
    addFromCatalog,
    toggleItem,
    updateItem,
    deleteItem,
    clearCompleted,
    clearAll,
    resetToSample,
    generateWhatsAppShareText,
  };
}
