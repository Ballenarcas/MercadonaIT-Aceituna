import { describe, it, expect } from 'vitest';
import { MERCADONA_CATEGORIES, CATEGORY_MAP, getCategoryById } from '../categories';

describe('categories data & helpers', () => {
  it('contains valid Mercadona categories ordered by aisle', () => {
    expect(MERCADONA_CATEGORIES.length).toBeGreaterThanOrEqual(10);
    
    // Validate order is sequential/ascending
    for (let i = 0; i < MERCADONA_CATEGORIES.length - 1; i++) {
      expect(MERCADONA_CATEGORIES[i].order).toBeLessThanOrEqual(MERCADONA_CATEGORIES[i + 1].order);
    }
  });

  it('maps categories properly in CATEGORY_MAP', () => {
    expect(CATEGORY_MAP.get('fruta-verdura')).toBeDefined();
    expect(CATEGORY_MAP.get('lacteos-huevos')?.name).toBe('Lácteos, Yogures y Huevos');
  });

  it('returns valid category for existing ID with getCategoryById', () => {
    const cat = getCategoryById('limpieza');
    expect(cat.id).toBe('limpieza');
    expect(cat.emoji).toBe('🧹');
  });

  it('returns fallback category for unknown ID with getCategoryById', () => {
    const fallback = getCategoryById('non_existent_category_123');
    expect(fallback.id).toBe('otros');
    expect(fallback.name).toBe('Varios');
    expect(fallback.order).toBe(99);
  });
});
