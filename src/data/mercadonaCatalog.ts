import type { CatalogProduct, ShoppingItem } from '../types';

export const POPULAR_MERCADONA_CATALOG: CatalogProduct[] = [
  // Fruta y verdura
  { id: 'cat-1', name: 'Aguacates listos para comer', categoryId: 'fruta-verdura', brand: 'Hacendado', defaultUnit: 'pack', typicalPrice: 2.89, popular: true },
  { id: 'cat-2', name: 'Plátano de Canarias', categoryId: 'fruta-verdura', brand: 'General', defaultUnit: 'kg', typicalPrice: 1.95, popular: true },
  { id: 'cat-3', name: 'Tomates cherry pera', categoryId: 'fruta-verdura', brand: 'Hacendado', defaultUnit: 'pack', typicalPrice: 1.65, popular: true },
  { id: 'cat-4', name: 'Bolsa Ensalada 4 Estaciones', categoryId: 'fruta-verdura', brand: 'Hacendado', defaultUnit: 'ud', typicalPrice: 0.99, popular: true },
  { id: 'cat-5', name: 'Limones malla', categoryId: 'fruta-verdura', brand: 'Hacendado', defaultUnit: 'kg', typicalPrice: 1.79 },

  // Panadería
  { id: 'cat-6', name: 'Pan de molde 100% integral sin corteza', categoryId: 'horno-pan', brand: 'Hacendado', defaultUnit: 'ud', typicalPrice: 1.35, popular: true },
  { id: 'cat-7', name: 'Barra de pan rústica recién horneada', categoryId: 'horno-pan', brand: 'Hacendado', defaultUnit: 'ud', typicalPrice: 0.65, popular: true },
  { id: 'cat-8', name: 'Picos camperos', categoryId: 'horno-pan', brand: 'Hacendado', defaultUnit: 'ud', typicalPrice: 1.10 },
  { id: 'cat-9', name: 'Empanada de atún', categoryId: 'horno-pan', brand: 'Hacendado', defaultUnit: 'ud', typicalPrice: 4.20 },

  // Lácteos
  { id: 'cat-10', name: 'Leche Semidesnatada Brick', categoryId: 'lacteos-huevos', brand: 'Hacendado', defaultUnit: 'pack', typicalPrice: 5.70, popular: true },
  { id: 'cat-11', name: 'Yogur +Proteínas Arándanos 0%', categoryId: 'lacteos-huevos', brand: 'Hacendado', defaultUnit: 'pack', typicalPrice: 1.60, popular: true },
  { id: 'cat-12', name: 'Huevos Camperos Clase L', categoryId: 'lacteos-huevos', brand: 'Hacendado', defaultUnit: 'docena', typicalPrice: 2.85, popular: true },
  { id: 'cat-13', name: 'Queso fresco batido 0%', categoryId: 'lacteos-huevos', brand: 'Hacendado', defaultUnit: 'ud', typicalPrice: 1.30, popular: true },
  { id: 'cat-14', name: 'Bebida de Avena sin azúcares', categoryId: 'lacteos-huevos', brand: 'Hacendado', defaultUnit: 'ud', typicalPrice: 1.05 },

  // Despensa & Aperitivos
  { id: 'cat-15', name: 'Hummus de garbanzos clásico', categoryId: 'despensa-conservas', brand: 'Hacendado', defaultUnit: 'ud', typicalPrice: 1.45, popular: true },
  { id: 'cat-16', name: 'Guacamole fresco 95% aguacate', categoryId: 'despensa-conservas', brand: 'Hacendado', defaultUnit: 'ud', typicalPrice: 1.99, popular: true },
  { id: 'cat-17', name: 'Aceite de Oliva Virgen Extra 1L', categoryId: 'despensa-conservas', brand: 'Hacendado', defaultUnit: 'litro', typicalPrice: 7.95, popular: true },
  { id: 'cat-18', name: 'Atún claro en aceite de oliva (Pack 6)', categoryId: 'despensa-conservas', brand: 'Hacendado', defaultUnit: 'pack', typicalPrice: 4.90, popular: true },
  { id: 'cat-19', name: 'Arroz redondo 1kg', categoryId: 'despensa-conservas', brand: 'Hacendado', defaultUnit: 'ud', typicalPrice: 1.35 },
  { id: 'cat-20', name: 'Pasta Espaguetis finos 500g', categoryId: 'despensa-conservas', brand: 'Hacendado', defaultUnit: 'ud', typicalPrice: 0.89 },
  { id: 'cat-21', name: 'Tomate frito receta artesana', categoryId: 'despensa-conservas', brand: 'Hacendado', defaultUnit: 'ud', typicalPrice: 1.50, popular: true },
  { id: 'cat-22', name: 'Anacardos tostados sin sal', categoryId: 'aperitivos-dulces', brand: 'Hacendado', defaultUnit: 'ud', typicalPrice: 2.70 },
  { id: 'cat-23', name: 'Chocolate negro 85% cacao', categoryId: 'aperitivos-dulces', brand: 'Hacendado', defaultUnit: 'ud', typicalPrice: 1.25, popular: true },

  // Carnes y Pescados
  { id: 'cat-24', name: 'Pechuga de pollo fileteada corte fino', categoryId: 'carne', brand: 'Hacendado', defaultUnit: 'bandeja', typicalPrice: 4.80, popular: true },
  { id: 'cat-25', name: 'Carne picada mixta vacuno/cerdo', categoryId: 'carne', brand: 'Hacendado', defaultUnit: 'bandeja', typicalPrice: 3.90 },
  { id: 'cat-26', name: 'Lomos de Salmón fresco sin espinas', categoryId: 'pescado', brand: 'General', defaultUnit: 'bandeja', typicalPrice: 6.50, popular: true },
  { id: 'cat-27', name: 'Jamón Serrano Gran Reserva cortado', categoryId: 'charcuteria-quesos', brand: 'Hacendado', defaultUnit: 'pack', typicalPrice: 2.65, popular: true },

  // Congelados
  { id: 'cat-28', name: 'Helado Polvito Hacendado', categoryId: 'congelados', brand: 'Hacendado', defaultUnit: 'ud', typicalPrice: 2.95, popular: true },
  { id: 'cat-29', name: 'Pizza Jamón y Queso Masa Fina', categoryId: 'congelados', brand: 'Hacendado', defaultUnit: 'ud', typicalPrice: 2.60 },
  { id: 'cat-30', name: 'Salteado de verduras campestre congelado', categoryId: 'congelados', brand: 'Hacendado', defaultUnit: 'ud', typicalPrice: 1.45 },

  // Bosque Verde (Limpieza)
  { id: 'cat-31', name: 'Detergente líquido Marsella Bosque Verde', categoryId: 'limpieza', brand: 'Bosque Verde', defaultUnit: 'ud', typicalPrice: 4.10, popular: true },
  { id: 'cat-32', name: 'Friegasuelos Perfumado Pino', categoryId: 'limpieza', brand: 'Bosque Verde', defaultUnit: 'ud', typicalPrice: 1.15, popular: true },
  { id: 'cat-33', name: 'Papel de cocina doble capa absorbente', categoryId: 'limpieza', brand: 'Bosque Verde', defaultUnit: 'pack', typicalPrice: 2.40 },
  { id: 'cat-34', name: 'Pastillas lavavajillas Todo en 1', categoryId: 'limpieza', brand: 'Bosque Verde', defaultUnit: 'pack', typicalPrice: 3.85 },

  // Deliplus (Perfumería)
  { id: 'cat-35', name: 'Gel de Baño Aceite de Argán', categoryId: 'perfumeria', brand: 'Deliplus', defaultUnit: 'ud', typicalPrice: 1.50, popular: true },
  { id: 'cat-36', name: 'Crema Hidratante Facial Hidra-Sensitive', categoryId: 'perfumeria', brand: 'Deliplus', defaultUnit: 'ud', typicalPrice: 4.50 },
  { id: 'cat-37', name: 'Toallitas húmedas para bebés', categoryId: 'perfumeria', brand: 'Deliplus', defaultUnit: 'pack', typicalPrice: 1.35 },

  // Bebidas
  { id: 'cat-38', name: 'Zumo de naranja recién exprimido 500ml', categoryId: 'bebidas', brand: 'Hacendado', defaultUnit: 'ud', typicalPrice: 2.10, popular: true },
  { id: 'cat-39', name: 'Pack Agua Mineral Natural 6x1.5L', categoryId: 'bebidas', brand: 'Hacendado', defaultUnit: 'pack', typicalPrice: 2.22, popular: true },
  { id: 'cat-40', name: 'Cerveza Doble Malta Falke 1925', categoryId: 'bebidas', brand: 'Hacendado', defaultUnit: 'pack', typicalPrice: 3.60 }
];

export const INITIAL_SAMPLE_ITEMS: ShoppingItem[] = [
  {
    id: 'init-1',
    name: 'Hummus de garbanzos clásico',
    categoryId: 'despensa-conservas',
    brand: 'Hacendado',
    quantity: 2,
    unit: 'ud',
    estimatedPrice: 1.45,
    notes: 'Para picar con zanahorias',
    completed: false,
    priority: 'alta',
    createdAt: Date.now() - 100000
  },
  {
    id: 'init-2',
    name: 'Plátano de Canarias',
    categoryId: 'fruta-verdura',
    brand: 'General',
    quantity: 1.5,
    unit: 'kg',
    estimatedPrice: 1.95,
    notes: 'Que no estén muy verdes',
    completed: false,
    priority: 'media',
    createdAt: Date.now() - 90000
  },
  {
    id: 'init-3',
    name: 'Yogur +Proteínas Arándanos 0%',
    categoryId: 'lacteos-huevos',
    brand: 'Hacendado',
    quantity: 1,
    unit: 'pack',
    estimatedPrice: 1.60,
    completed: true,
    priority: 'media',
    createdAt: Date.now() - 80000
  },
  {
    id: 'init-4',
    name: 'Detergente líquido Marsella',
    categoryId: 'limpieza',
    brand: 'Bosque Verde',
    quantity: 1,
    unit: 'ud',
    estimatedPrice: 4.10,
    notes: 'Bote grande azul',
    completed: false,
    priority: 'alta',
    createdAt: Date.now() - 70000
  },
  {
    id: 'init-5',
    name: 'Lomos de Salmón fresco',
    categoryId: 'pescado',
    brand: 'General',
    quantity: 2,
    unit: 'bandeja',
    estimatedPrice: 6.50,
    completed: false,
    priority: 'media',
    createdAt: Date.now() - 60000
  }
];
