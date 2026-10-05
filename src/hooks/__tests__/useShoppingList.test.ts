import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useShoppingList } from '../useShoppingList';

vi.mock('../../services/api', () => ({
  api: {
    isBackendAvailable: vi.fn().mockResolvedValue(false),
    getLists: vi.fn().mockResolvedValue([]),
    getItems: vi.fn().mockResolvedValue([]),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    toggleCart: vi.fn(),
    deleteItem: vi.fn(),
    clearCart: vi.fn(),
    clearCompleted: vi.fn(),
    moveAllToCart: vi.fn(),
    resetSample: vi.fn(),
  },
}));

describe('useShoppingList hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes with default lists and sample items', async () => {
    const { result } = renderHook(() => useShoppingList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.lists.length).toBeGreaterThanOrEqual(1);
    expect(result.current.activeListId).toBe('default');
    expect(result.current.activeList.name).toBe('Compra Semanal');
    expect(result.current.items.length).toBeGreaterThan(0);
  });

  it('creates a new list and sets it as active', async () => {
    const { result } = renderHook(() => useShoppingList());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createList('Fiesta de Cumpleaños', '🎂', '#ec4899');
    });

    expect(result.current.lists.some((l) => l.name === 'Fiesta de Cumpleaños')).toBe(true);
    expect(result.current.activeList.name).toBe('Fiesta de Cumpleaños');
  });

  it('updates an existing list', async () => {
    const { result } = renderHook(() => useShoppingList());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateList('default', { name: 'Super Compra' });
    });

    expect(result.current.activeList.name).toBe('Super Compra');
  });

  it('deletes a list and switches to remaining list', async () => {
    const { result } = renderHook(() => useShoppingList());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Create a second list to allow deletion
    await act(async () => {
      await result.current.createList('Lista Extra', '📌', '#10b981');
    });

    const extraListId = result.current.activeListId;

    await act(async () => {
      await result.current.deleteList(extraListId);
    });

    expect(result.current.lists.some((l) => l.id === extraListId)).toBe(false);
  });

  it('adds an item to current active list', async () => {
    const { result } = renderHook(() => useShoppingList());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addItem({
        name: 'Guacamole Hacendado',
        categoryId: 'aperitivos-dulces',
        brand: 'Hacendado',
        quantity: 2,
        unit: 'ud',
        estimatedPrice: 1.75,
        priority: 'alta',
      });
    });

    const added = result.current.items.find((i) => i.name === 'Guacamole Hacendado');
    expect(added).toBeDefined();
    expect(added?.quantity).toBe(2);
    expect(added?.inCart).toBe(false);
  });

  it('toggles item into cart and updates stats', async () => {
    const { result } = renderHook(() => useShoppingList());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const itemToToggle = result.current.pendingListItems[0];
    expect(itemToToggle).toBeDefined();

    await act(async () => {
      await result.current.toggleCart(itemToToggle.id);
    });

    const toggled = result.current.items.find((i) => i.id === itemToToggle.id);
    expect(toggled?.inCart).toBe(true);
    expect(toggled?.completed).toBe(true);
  });

  it('updates item properties', async () => {
    const { result } = renderHook(() => useShoppingList());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const item = result.current.items[0];
    await act(async () => {
      await result.current.updateItem(item.id, { quantity: 10 });
    });

    const updated = result.current.items.find((i) => i.id === item.id);
    expect(updated?.quantity).toBe(10);
  });

  it('deletes item from active list', async () => {
    const { result } = renderHook(() => useShoppingList());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const item = result.current.items[0];
    await act(async () => {
      await result.current.deleteItem(item.id);
    });

    expect(result.current.items.some((i) => i.id === item.id)).toBe(false);
  });

  it('moves all items to cart', async () => {
    const { result } = renderHook(() => useShoppingList());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.moveAllToCart();
    });

    expect(result.current.pendingListItems.length).toBe(0);
    expect(result.current.cartItems.length).toBe(result.current.items.length);
  });

  it('clears cart items', async () => {
    const { result } = renderHook(() => useShoppingList());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.clearCart();
    });

    expect(result.current.cartItems.length).toBe(0);
  });

  it('filters items by search query and category', async () => {
    const { result } = renderHook(() => useShoppingList());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setSearchQuery('leche');
    });

    expect(result.current.filteredListItems.every((i) => i.name.toLowerCase().includes('leche'))).toBe(true);

    act(() => {
      result.current.setSearchQuery('');
      result.current.setSelectedCategory('fruta-verdura');
    });

    expect(result.current.filteredListItems.every((i) => i.categoryId === 'fruta-verdura')).toBe(true);
  });

  it('generates whatsapp share text with list name and totals', async () => {
    const { result } = renderHook(() => useShoppingList());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const shareText = result.current.generateWhatsAppShareText();
    expect(shareText).toContain('COMPRA MERCADONA');
    expect(shareText).toContain('Total en Carrito');
    expect(shareText).toContain('Total Estimado');
  });
});
