import type { Category } from '../types';

export const MERCADONA_CATEGORIES: Category[] = [
  {
    id: 'fruta-verdura',
    name: 'Fruta y Verdura',
    emoji: '🥑',
    color: '#16a34a',
    order: 1,
    description: 'Entrada y frescos'
  },
  {
    id: 'horno-pan',
    name: 'Panadería y Horno',
    emoji: '🥖',
    color: '#d97706',
    order: 2,
    description: 'Pan del día, bollería y empanadas'
  },
  {
    id: 'charcuteria-quesos',
    name: 'Charcutería y Quesos',
    emoji: '🧀',
    color: '#ea580c',
    order: 3,
    description: 'Jamón, embutidos y quesos'
  },
  {
    id: 'carne',
    name: 'Carnicería',
    emoji: '🥩',
    color: '#dc2626',
    order: 4,
    description: 'Bandejas y carnes frescas'
  },
  {
    id: 'pescado',
    name: 'Pescadería',
    emoji: '🐟',
    color: '#0284c7',
    order: 5,
    description: 'Pescado fresco y marisco'
  },
  {
    id: 'lacteos-huevos',
    name: 'Lácteos, Yogures y Huevos',
    emoji: '🥛',
    color: '#0d9488',
    order: 6,
    description: 'Leches, yogures +Proteínas, mantequillas'
  },
  {
    id: 'despensa-conservas',
    name: 'Despensa, Pasta y Aceites',
    emoji: '🥫',
    color: '#ca8a04',
    order: 7,
    description: 'Aceite de oliva, legumbres, arroz, salsas'
  },
  {
    id: 'aperitivos-dulces',
    name: 'Aperitivos y Chocolates',
    emoji: '🍫',
    color: '#9333ea',
    order: 8,
    description: 'Frutos secos, patatas, galletas Hacendado'
  },
  {
    id: 'bebidas',
    name: 'Bebidas y Aguas',
    emoji: '🧃',
    color: '#2563eb',
    order: 9,
    description: 'Zumos frescos, refrescos, cervezas, vino'
  },
  {
    id: 'congelados',
    name: 'Congelados y Helados',
    emoji: '🧊',
    color: '#06b6d4',
    order: 10,
    description: 'Verduras congeladas, pescados, pizzas, helados'
  },
  {
    id: 'limpieza',
    name: 'Limpieza del Hogar (Bosque Verde)',
    emoji: '🧹',
    color: '#059669',
    order: 11,
    description: 'Detergentes, friegasuelos, papel cocina'
  },
  {
    id: 'perfumeria',
    name: 'Perfumería y Cuidado (Deliplus)',
    emoji: '🧴',
    color: '#db2777',
    order: 12,
    description: 'Geles, champús, cremas faciales, toallitas'
  },
  {
    id: 'mascotas',
    name: 'Mascotas (Compy)',
    emoji: '🐾',
    color: '#7c3aed',
    order: 13,
    description: 'Pienso perro, gato y snacks'
  },
  {
    id: 'otros',
    name: 'Varios y Bazar',
    emoji: '🛒',
    color: '#64748b',
    order: 14,
    description: 'Pilas, bolsas y otros artículos'
  }
];

export const CATEGORY_MAP = new Map(MERCADONA_CATEGORIES.map(c => [c.id, c]));

export function getCategoryById(id: string): Category {
  return CATEGORY_MAP.get(id) || {
    id: 'otros',
    name: 'Varios',
    emoji: '🛒',
    color: '#64748b',
    order: 99
  };
}
