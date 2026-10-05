import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ShoppingItem, ShoppingList, SortOption, FilterStatus, CatalogProduct } from '../types';
import { INITIAL_SAMPLE_ITEMS } from '../data/mercadonaCatalog';
import { getCategoryById } from '../data/categories';
import { api } from '../services/api';

const STORAGE_KEY_ITEMS = 'mercadona_shopping_items_v2';
const STORAGE_KEY_LISTS = 'mercadona_shopping_lists_v2';
const STORAGE_KEY_ACTIVE_LIST = 'mercadona_active_list_id_v2';

const DEFAULT_LISTS: ShoppingList[] = [
  {
    id: 'default',
    name: 'Compra Semanal',
    emoji: '🛒',
    color: '#059669',
    itemCount: 5,
    cartCount: 1,
    totalEstimated: 16.65,
    cartEstimated: 1.60,
    createdAt: Date.now() - 100000,
  },
  {
    id: 'list-barbacoa',
    name: 'Barbacoa con Amigos',
    emoji: '🥩',
    color: '#ea580c',
    itemCount: 0,
    cartCount: 0,
    totalEstimated: 0,
    cartEstimated: 0,
    createdAt: Date.now() - 50000,
  }
];

export function useShoppingList() {
  // Lists state
  const [lists, setLists] = useState<ShoppingList[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LISTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_LISTS;
  });

  const [activeListId, setActiveListId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_LIST);
      if (saved) return saved;
    } catch (e) {
      console.error(e);
    }
    return 'default';
  });

  // Items state
  const [items, setItems] = useState<ShoppingItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SAMPLE_ITEMS.map((item) => ({
      ...item,
      listId: 'default',
      inCart: item.completed,
    }));
  });

  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('aisle');

  // Sync with FastAPI backend
  const checkBackendAndSync = useCallback(async () => {
    setIsLoading(true);
    const available = await api.isBackendAvailable();
    setIsBackendConnected(available);

    if (available) {
      try {
        const [remoteLists, remoteItems] = await Promise.all([
          api.getLists(),
          api.getItems(),
        ]);
        if (remoteLists && remoteLists.length > 0) {
          setLists(remoteLists);
          // If activeListId doesn't exist in remote lists, select the first
          if (!remoteLists.some((l) => l.id === activeListId)) {
            setActiveListId(remoteLists[0].id);
          }
        }
        if (remoteItems) {
          setItems(remoteItems);
        }
      } catch (e) {
        console.warn('Error fetching data from FastAPI, using local cache', e);
      }
    }
    setIsLoading(false);
  }, [activeListId]);

  useEffect(() => {
    checkBackendAndSync();
  }, [checkBackendAndSync]);

  // Local storage backups
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
      localStorage.setItem(STORAGE_KEY_LISTS, JSON.stringify(lists));
      localStorage.setItem(STORAGE_KEY_ACTIVE_LIST, activeListId);
    } catch (e) {
      console.error(e);
    }
  }, [items, lists, activeListId]);

  // Current active list object
  const activeList = useMemo(() => {
    return lists.find((l) => l.id === activeListId) || lists[0] || DEFAULT_LISTS[0];
  }, [lists, activeListId]);

  // Items for the current active list
  const activeListAllItems = useMemo(() => {
    return items.filter((i) => i.listId === activeListId);
  }, [items, activeListId]);

  // Split into List (pending to buy) vs Cart (already in supermarket cart)
  const pendingListItems = useMemo(() => {
    return activeListAllItems.filter((i) => !i.inCart);
  }, [activeListAllItems]);

  const cartItems = useMemo(() => {
    return activeListAllItems.filter((i) => i.inCart);
  }, [activeListAllItems]);

  // --- LIST MANAGEMENT ---
  const createList = async (name: string, emoji = '🛒', color = '#059669') => {
    if (isBackendConnected) {
      try {
        const created = await api.createList({ name, emoji, color });
        setLists((prev) => [...prev, created]);
        setActiveListId(created.id);
        return;
      } catch (e) {
        console.error('Error creating list in backend', e);
      }
    }

    const newList: ShoppingList = {
      id: 'list_' + Date.now(),
      name,
      emoji,
      color,
      itemCount: 0,
      cartCount: 0,
      totalEstimated: 0,
      cartEstimated: 0,
      createdAt: Date.now(),
    };
    setLists((prev) => [...prev, newList]);
    setActiveListId(newList.id);
  };

  const updateList = async (listId: string, updates: Partial<ShoppingList>) => {
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, ...updates } : l)));
    if (isBackendConnected) {
      try {
        await api.updateList(listId, updates);
      } catch (e) {
        console.error('Error updating list in backend', e);
      }
    }
  };

  const deleteList = async (listId: string) => {
    if (lists.length <= 1) {
      alert('No puedes eliminar la única lista.');
      return;
    }
    const remainingLists = lists.filter((l) => l.id !== listId);
    setLists(remainingLists);
    setItems((prev) => prev.filter((i) => i.listId !== listId));
    if (activeListId === listId) {
      setActiveListId(remainingLists[0].id);
    }

    if (isBackendConnected) {
      try {
        await api.deleteList(listId);
      } catch (e) {
        console.error('Error deleting list in backend', e);
      }
    }
  };

  // --- ITEM MANAGEMENT ---
  const addItem = async (itemData: Omit<ShoppingItem, 'id' | 'createdAt' | 'completed' | 'inCart' | 'listId'>) => {
    const fullData = {
      ...itemData,
      listId: activeListId,
    };

    if (isBackendConnected) {
      try {
        const created = await api.createItem(fullData);
        setItems((prev) => [created, ...prev]);
        return;
      } catch (e) {
        console.error('Error adding item to backend', e);
      }
    }

    const newItem: ShoppingItem = {
      ...fullData,
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      completed: false,
      inCart: false,
      createdAt: Date.now(),
    };
    setItems((prev) => [newItem, ...prev]);
  };

  const addFromCatalog = async (product: CatalogProduct) => {
    const existingIndex = activeListAllItems.findIndex(
      (i) => i.name.toLowerCase() === product.name.toLowerCase()
    );

    if (existingIndex > -1) {
      const existing = activeListAllItems[existingIndex];
      updateItem(existing.id, { quantity: existing.quantity + 1 });
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

  // Toggle item into/out of the cart (Cart separation!)
  const toggleCart = async (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, inCart: !item.inCart, completed: !item.inCart }
          : item
      )
    );

    if (isBackendConnected) {
      try {
        await api.toggleCart(id);
      } catch (e) {
        console.error('Error toggling cart state on backend', e);
      }
    }
  };

  const updateItem = async (id: string, updates: Partial<ShoppingItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));

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

  const moveAllToCart = async () => {
    setItems((prev) =>
      prev.map((i) => (i.listId === activeListId ? { ...i, inCart: true, completed: true } : i))
    );

    if (isBackendConnected) {
      try {
        await api.moveAllToCart(activeListId);
      } catch (e) {
        console.error('Error moving all to cart on backend', e);
      }
    }
  };

  const clearCart = async () => {
    setItems((prev) => prev.filter((i) => !(i.listId === activeListId && i.inCart)));

    if (isBackendConnected) {
      try {
        await api.clearCart(activeListId);
      } catch (e) {
        console.error('Error clearing cart on backend', e);
      }
    }
  };

  const clearAllList = async () => {
    setItems((prev) => prev.filter((i) => i.listId !== activeListId));

    if (isBackendConnected) {
      try {
        await api.clearCompleted(activeListId);
      } catch (e) {
        console.error('Error clearing list items on backend', e);
      }
    }
  };

  const resetToSample = async () => {
    if (isBackendConnected) {
      try {
        const resetItems = await api.resetSample(activeListId);
        setItems((prev) => [
          ...prev.filter((i) => i.listId !== activeListId),
          ...resetItems,
        ]);
        return;
      } catch (e) {
        console.error('Error resetting samples on backend', e);
      }
    }

    const samples: ShoppingItem[] = INITIAL_SAMPLE_ITEMS.map((item) => ({
      ...item,
      listId: activeListId,
      inCart: item.completed,
    }));

    setItems((prev) => [
      ...prev.filter((i) => i.listId !== activeListId),
      ...samples,
    ]);
  };

  /** Re-fetch all items from the backend (e.g. after the AI adds recipe ingredients) */
  const refreshItems = useCallback(async () => {
    if (!isBackendConnected) return;
    try {
      const remoteItems = await api.getItems();
      if (remoteItems) setItems(remoteItems);
    } catch (e) {
      console.error('Error refreshing items from backend', e);
    }
  }, [isBackendConnected]);


  // Stats calculation
  const stats = useMemo(() => {
    const totalItems = activeListAllItems.length;
    const cartCount = cartItems.length;
    const listCount = pendingListItems.length;

    let totalEstimated = 0;
    let listEstimated = 0;
    let cartEstimated = 0;

    activeListAllItems.forEach((item) => {
      const price = (item.estimatedPrice || 0) * (item.quantity || 1);
      totalEstimated += price;
      if (item.inCart) {
        cartEstimated += price;
      } else {
        listEstimated += price;
      }
    });

    const progressPercentage = totalItems === 0 ? 0 : Math.round((cartCount / totalItems) * 100);

    return {
      totalItems,
      listItemsCount: listCount,
      cartItemsCount: cartCount,
      totalEstimated,
      listEstimated,
      cartEstimated,
      progressPercentage,
    };
  }, [activeListAllItems, cartItems, pendingListItems]);

  // Filtering and sorting items for the current active view
  const filterAndSortItems = useCallback((itemList: ShoppingItem[]) => {
    let result = [...itemList];

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

    result.sort((a, b) => {
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
  }, [searchQuery, selectedCategory, sortBy]);

  const filteredListItems = useMemo(() => filterAndSortItems(pendingListItems), [filterAndSortItems, pendingListItems]);
  const filteredCartItems = useMemo(() => filterAndSortItems(cartItems), [filterAndSortItems, cartItems]);

  // Group pending list items by category (aisle order)
  const groupedListItems = useMemo(() => {
    const groups: { [catId: string]: ShoppingItem[] } = {};
    filteredListItems.forEach((item) => {
      if (!groups[item.categoryId]) groups[item.categoryId] = [];
      groups[item.categoryId].push(item);
    });

    return Object.entries(groups)
      .map(([catId, catItems]) => ({
        category: getCategoryById(catId),
        items: catItems,
      }))
      .sort((a, b) => a.category.order - b.category.order);
  }, [filteredListItems]);

  // Group cart items by category
  const groupedCartItems = useMemo(() => {
    const groups: { [catId: string]: ShoppingItem[] } = {};
    filteredCartItems.forEach((item) => {
      if (!groups[item.categoryId]) groups[item.categoryId] = [];
      groups[item.categoryId].push(item);
    });

    return Object.entries(groups)
      .map(([catId, catItems]) => ({
        category: getCategoryById(catId),
        items: catItems,
      }))
      .sort((a, b) => a.category.order - b.category.order);
  }, [filteredCartItems]);

  const generateWhatsAppShareText = () => {
    const lines: string[] = [
      `🛒 *COMPRA MERCADONA: ${activeList.name.toUpperCase()}* 🛒`,
      ''
    ];

    if (pendingListItems.length > 0) {
      lines.push('📋 *POR COMPRAR (EN LA LISTA):*');
      pendingListItems.forEach((item) => {
        const price = item.estimatedPrice
          ? ` (~${(item.estimatedPrice * item.quantity).toFixed(2)}€)`
          : '';
        const note = item.notes ? ` _(${item.notes})_` : '';
        lines.push(`⬜ ${item.name} (${item.quantity} ${item.unit})${price}${note}`);
      });
      lines.push('');
    }

    if (cartItems.length > 0) {
      lines.push('✅ *EN EL CARRITO DE LA TIENDA:*');
      cartItems.forEach((item) => {
        const price = item.estimatedPrice
          ? ` (~${(item.estimatedPrice * item.quantity).toFixed(2)}€)`
          : '';
        lines.push(`🛒 ${item.name} (${item.quantity} ${item.unit})${price}`);
      });
      lines.push('');
    }

    lines.push(`💰 *Total en Carrito:* ${stats.cartEstimated.toFixed(2)} €`);
    lines.push(`🧾 *Total Estimado Lista:* ${stats.totalEstimated.toFixed(2)} €`);
    lines.push(`📦 *Progreso:* ${stats.cartItemsCount}/${stats.totalItems} artículos en el carro (${stats.progressPercentage}%)`);

    return lines.join('\n');
  };

  return {
    // Lists
    lists,
    activeList,
    activeListId,
    setActiveListId,
    createList,
    updateList,
    deleteList,

    // Items
    items: activeListAllItems,
    filteredListItems,
    filteredCartItems,
    groupedListItems,
    groupedCartItems,
    pendingListItems,
    cartItems,

    // Stats & Filters
    stats,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,

    // Backend status
    isBackendConnected,
    isLoading,
    refreshBackend: checkBackendAndSync,

    // Actions
    addItem,
    addFromCatalog,
    toggleCart,
    updateItem,
    deleteItem,
    moveAllToCart,
    clearCart,
    clearAllList,
    resetToSample,
    refreshItems,
    generateWhatsAppShareText,
  };
}
