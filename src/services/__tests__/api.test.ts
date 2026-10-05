import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';

describe('api service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('checks backend availability returning true on 200', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'online' }),
    });

    const isAvail = await api.isBackendAvailable();
    expect(isAvail).toBe(true);
  });

  it('checks backend availability returning false on network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const isAvail = await api.isBackendAvailable();
    expect(isAvail).toBe(false);
  });

  it('fetches lists correctly', async () => {
    const mockLists = [{ id: 'default', name: 'Compra Semanal', emoji: '🛒', color: '#059669', itemCount: 1, cartCount: 0, totalEstimated: 2.5, cartEstimated: 0, createdAt: 100 }];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockLists,
    });

    const lists = await api.getLists();
    expect(lists).toEqual(mockLists);
  });

  it('creates list correctly', async () => {
    const createdList = { id: 'list_123', name: 'Nueva', emoji: '🥗', color: '#10b981', itemCount: 0, cartCount: 0, totalEstimated: 0, cartEstimated: 0, createdAt: 200 };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => createdList,
    });

    const result = await api.createList({ name: 'Nueva' });
    expect(result).toEqual(createdList);
  });

  it('updates list correctly', async () => {
    const updated = { id: 'list_123', name: 'Updated' };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => updated,
    });

    const result = await api.updateList('list_123', { name: 'Updated' });
    expect(result).toEqual(updated);
  });

  it('deletes list correctly', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    await expect(api.deleteList('list_123')).resolves.not.toThrow();
  });

  it('fetches items with query parameters', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    await api.getItems({
      listId: 'default',
      inCart: true,
      categoryId: 'fruta-verdura',
      completed: true,
      search: 'manzana',
      sortBy: 'aisle',
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('list_id=default')
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('in_cart=true')
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('category_id=fruta-verdura')
    );
  });

  it('creates item correctly', async () => {
    const mockItem = {
      id: 'item_1',
      listId: 'default',
      name: 'Aceitunas',
      categoryId: 'aperitivos-dulces',
      brand: 'Hacendado' as const,
      quantity: 1,
      unit: 'ud' as const,
      completed: false,
      inCart: false,
      priority: 'alta' as const,
      createdAt: 100,
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockItem,
    });

    const result = await api.createItem({
      listId: 'default',
      name: 'Aceitunas',
      categoryId: 'aperitivos-dulces',
      brand: 'Hacendado',
      quantity: 1,
      unit: 'ud',
      priority: 'alta',
    });

    expect(result).toEqual(mockItem);
  });

  it('toggles item in cart', async () => {
    const toggled = { id: 'item_1', inCart: true, completed: true };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => toggled,
    });

    const res = await api.toggleCart('item_1');
    expect(res).toEqual(toggled);
  });

  it('handles API errors by throwing error with message', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    });

    await expect(api.getItems()).rejects.toThrow('Error al obtener artículos: Not Found');
  });

  it('fetches share text correctly', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ shareText: 'Texto compartido Mercadona' }),
    });

    const text = await api.getShareText('default');
    expect(text).toBe('Texto compartido Mercadona');
  });
});
