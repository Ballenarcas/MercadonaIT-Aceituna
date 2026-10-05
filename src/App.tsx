import { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import ChatBot from './components/ChatBot';
import CreateRecipeModal from './components/CreateRecipeModal';
import { api } from './services/api';
import type { Recipe, ShoppingItem, ShoppingList } from './types';

// Fallback de catálogo si el backend está desconectado
const FALLBACK_AVAILABLE_PRODUCTS = [
  'Leche entera', 'Leche semidesnatada', 'Huevos camperos', 'Pan de molde', 
  'Aceite de oliva virgen extra', 'Plátanos de Canarias', 'Vino tinto Rioja', 
  'Queso curado de oveja', 'Jamón serrano', 'Uvas sin semillas', 'Tomates pera', 
  'Cebollas', 'Ajos', 'Garbanzos', 'Pollo troceado', 'Arroz redondo', 'Macarrones'
];

// Mapeo de fotos apetitosas para recetas populares de Mercadona
const RECIPE_IMAGE_MAP: Record<string, string> = {
  'Macarrones a la boloñesa': 'https://images.unsplash.com/photo-1621996346565-e3d5d62816f1?auto=format&fit=crop&q=80&w=600',
  'Arroz a la cubana con huevo': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600',
  'Pechuga de pollo a la plancha': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&q=80&w=600',
  'Ensalada templada de quinoa y verduras': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600',
  'Salmón al horno con verduras': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=600',
  'Tortilla de patata con cebolla': 'https://images.unsplash.com/photo-1584847642060-a46e239155a8?auto=format&fit=crop&q=80&w=600',
  'Lentejas guisadas con verduras': 'https://images.unsplash.com/photo-1548946522-4a3ce3e49522?auto=format&fit=crop&q=80&w=600',
  'Ensalada de garbanzos con pollo': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600',
  'Pasta al pesto de pistacho': 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&q=80&w=600',
  'Lentejas tradicionales': 'https://images.unsplash.com/photo-1548946522-4a3ce3e49522?auto=format&fit=crop&q=80&w=600',
  'Tostada de aguacate y huevo': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=600',
};

const DEFAULT_RECIPE_IMAGE = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600';

interface DisplayRecipe {
  id: string | number;
  title: string;
  creator: string;
  description: string;
  image: string;
  imageEmoji: string;
  isSaved: boolean;
  category?: string;
  servings?: number;
  prepTimeMin?: number;
}

function App() {
  const [activeTab, setActiveTab] = useState('Mis listas');

  // --- ESTADOS DE LISTAS E ITEMS (BD) ---
  const [dbLists, setDbLists] = useState<ShoppingList[]>([]);
  const [dbItems, setDbItems] = useState<ShoppingItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<string[]>(FALLBACK_AVAILABLE_PRODUCTS);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [listToAddProduct, setListToAddProduct] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- ESTADOS DE RECETAS (BD) ---
  const [activeRecipeTab, setActiveRecipeTab] = useState('Comunidad');
  const [dbRecipes, setDbRecipes] = useState<Recipe[]>([]);
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('mercadona_saved_recipe_ids');
      if (saved) return new Set(JSON.parse(saved));
    } catch {
      // Ignorar error de parsing
    }
    return new Set(['recipe_1', 'recipe-ensalada-quinoa', 'recipe-lentejas-verduras']);
  });
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [isCreateRecipeOpen, setIsCreateRecipeOpen] = useState(false);

  // --- CARGA DE DATOS DESDE EL BACKEND ---
  const loadDataFromBackend = useCallback(async () => {
    try {

      // Cargar listas y artículos de la base de datos
      const [remoteLists, remoteItems, remoteRecipes, remoteCatalog] = await Promise.all([
        api.getLists().catch(() => []),
        api.getItems().catch(() => []),
        api.getRecipes().catch(() => []),
        api.getCatalog().catch(() => []),
      ]);

      if (remoteLists && remoteLists.length > 0) {
        setDbLists(remoteLists);
      } else {
        // Fallback inicial si no hay listas
        setDbLists([
          {
            id: 'default',
            name: 'Compra semanal',
            emoji: '🛒',
            color: '#00703c',
            itemCount: 0,
            cartCount: 0,
            totalEstimated: 0,
            cartEstimated: 0,
            createdAt: Date.now(),
          },
          {
            id: 'list-especial',
            name: 'Cena especial',
            emoji: '🍷',
            color: '#e23000',
            itemCount: 0,
            cartCount: 0,
            totalEstimated: 0,
            cartEstimated: 0,
            createdAt: Date.now(),
          },
        ]);
      }

      if (remoteItems) {
        setDbItems(remoteItems);
      }

      if (remoteRecipes && remoteRecipes.length > 0) {
        setDbRecipes(remoteRecipes);
      }

      if (remoteCatalog && remoteCatalog.length > 0) {
        const productNames = Array.from(new Set(remoteCatalog.map((p) => p.name)));
        setAvailableProducts(productNames);
      }
    } catch (e) {
      console.error('Error al conectar con la base de datos del backend:', e);
    }
  }, []);

  useEffect(() => {
    loadDataFromBackend();
  }, [loadDataFromBackend]);

  // Persistir recetas guardadas
  const toggleSaveRecipe = (recipeId: string | number) => {
    setSavedRecipeIds((prev) => {
      const next = new Set(prev);
      const strId = String(recipeId);
      if (next.has(strId)) {
        next.delete(strId);
      } else {
        next.add(strId);
      }
      try {
        localStorage.setItem('mercadona_saved_recipe_ids', JSON.stringify(Array.from(next)));
      } catch {
        // Ignorar
      }
      return next;
    });
  };

  // --- LÓGICA DE LISTAS CONECTADA AL BACKEND ---
  const handleAddList = async () => {
    const listName = `Nueva lista ${dbLists.length + 1}`;
    try {
      const created = await api.createList({ name: listName });
      setDbLists((prev) => [...prev, created]);
    } catch {
      // Offline fallback
      const localId = `list_${Date.now()}`;
      const localList: ShoppingList = {
        id: localId,
        name: listName,
        emoji: '📋',
        color: '#00703c',
        itemCount: 0,
        cartCount: 0,
        totalEstimated: 0,
        cartEstimated: 0,
        createdAt: Date.now(),
      };
      setDbLists((prev) => [...prev, localList]);
    }
  };

  const updateListTitle = async (id: string, newTitle: string) => {
    setDbLists((prev) =>
      prev.map((list) => (list.id === id ? { ...list, name: newTitle } : list))
    );
    try {
      await api.updateList(id, { name: newTitle });
    } catch (e) {
      console.warn('Error al actualizar título en backend:', e);
    }
  };

  const confirmDelete = async () => {
    if (listToDelete !== null) {
      const targetId = listToDelete;
      setDbLists((prev) => prev.filter((list) => list.id !== targetId));
      setDbItems((prev) => prev.filter((item) => item.listId !== targetId));
      setListToDelete(null);
      try {
        await api.deleteList(targetId);
      } catch (e) {
        console.warn('Error al eliminar lista en backend:', e);
      }
    }
  };

  const toggleCartStatus = async (listId: string) => {
    const itemsInList = dbItems.filter((i) => i.listId === listId);
    const allInCart = itemsInList.length > 0 && itemsInList.every((i) => i.inCart);

    if (!allInCart) {
      // Mover todos al carrito
      setDbItems((prev) =>
        prev.map((i) => (i.listId === listId ? { ...i, inCart: true, completed: true } : i))
      );
      try {
        await api.moveAllToCart(listId);
      } catch (e) {
        console.warn('Error al mover todo al carrito en backend:', e);
      }
    } else {
      // Devolver a la lista
      setDbItems((prev) =>
        prev.map((i) => (i.listId === listId ? { ...i, inCart: false, completed: false } : i))
      );
      // Toggle individual items
      for (const item of itemsInList) {
        api.toggleCart(item.id).catch(() => {});
      }
    }
  };

  // --- LÓGICA DE PRODUCTOS CONECTADA AL BACKEND ---
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return availableProducts.slice(0, 30);
    const q = searchQuery.toLowerCase();
    return availableProducts.filter((product) => product.toLowerCase().includes(q));
  }, [availableProducts, searchQuery]);

  const addProductToList = async (productName: string) => {
    if (listToAddProduct !== null) {
      const targetListId = listToAddProduct;
      const tempId = `item_${Date.now()}`;
      const newItem: ShoppingItem = {
        id: tempId,
        listId: targetListId,
        name: productName,
        categoryId: 'otros',
        brand: 'Hacendado',
        quantity: 1,
        unit: 'ud',
        completed: false,
        inCart: false,
        priority: 'media',
        createdAt: Date.now(),
      };

      setDbItems((prev) => [...prev, newItem]);
      setListToAddProduct(null);
      setSearchQuery('');

      try {
        const created = await api.createItem({
          listId: targetListId,
          name: productName,
          categoryId: 'otros',
          brand: 'Hacendado',
          quantity: 1,
          unit: 'ud',
          priority: 'media',
        });
        setDbItems((prev) => prev.map((i) => (i.id === tempId ? created : i)));
      } catch (e) {
        console.warn('Error al guardar artículo en backend:', e);
      }
    }
  };

  const removeProductFromList = async (itemId: string) => {
    setDbItems((prev) => prev.filter((item) => item.id !== itemId));
    try {
      await api.deleteItem(itemId);
    } catch (e) {
      console.warn('Error al eliminar artículo de backend:', e);
    }
  };

  // Callback cuando se crea una nueva receta
  const handleRecipeCreated = (newRecipe: Recipe) => {
    setDbRecipes((prev) => [newRecipe, ...prev]);
    // Marcar como guardada para que aparezca también en la pestaña de Guardados
    setSavedRecipeIds((prev) => new Set([...prev, String(newRecipe.id)]));
    setActiveRecipeTab('Comunidad');
  };

  // Formateo de recetas a mostrar desde la base de datos
  const displayedRecipes: DisplayRecipe[] = useMemo(() => {
    const q = recipeSearchQuery.toLowerCase().trim();

    return dbRecipes
      .map((r) => {
        const strId = String(r.id);
        const isSaved = savedRecipeIds.has(strId);
        const image = RECIPE_IMAGE_MAP[r.name] || DEFAULT_RECIPE_IMAGE;
        return {
          id: r.id,
          title: r.name,
          creator: (r as unknown as { creator?: string }).creator || '@mercadona_chef',
          description: r.description || 'Receta saludable elaborada con productos de calidad de Mercadona.',
          image,
          imageEmoji: r.imageEmoji || '🍽️',
          isSaved,
          category: r.category,
          servings: r.servings,
          prepTimeMin: r.prepTimeMin,
        };
      })
      .filter((r) => {
        const matchesTab = activeRecipeTab === 'Comunidad' ? true : r.isSaved;
        const matchesSearch =
          !q ||
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (r.category && r.category.toLowerCase().includes(q));
        return matchesTab && matchesSearch;
      });
  }, [dbRecipes, savedRecipeIds, activeRecipeTab, recipeSearchQuery]);

  // Lista activa principal para el Chatbot
  const activeChatList: ShoppingList = useMemo(() => {
    if (dbLists.length > 0) return dbLists[0];
    return {
      id: 'default',
      name: 'Compra Principal',
      emoji: '🛒',
      color: '#00703c',
      itemCount: 0,
      cartCount: 0,
      totalEstimated: 0,
      cartEstimated: 0,
      createdAt: Date.now(),
    };
  }, [dbLists]);

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col relative">
      <Header />

      {/* Menú inferior principal (Mis Listas y Recetas) */}
      <div className="w-full bg-white py-4 sm:py-6 flex items-center justify-center border-b border-gray-100 shadow-xs z-10 relative">
        <div className="flex items-center gap-4">
          {['Mis listas', 'Recetas'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-2.5 font-semibold rounded-lg transition-colors shadow-xs cursor-pointer ${
                activeTab === tab 
                  ? 'bg-[#00703c] text-white border border-[#00703c]' 
                  : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-[#00703c] hover:text-white hover:border-[#00703c]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 bg-gray-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* PESTAÑA: MIS LISTAS (CONECTADAS A SQLITE) */}
          {activeTab === 'Mis listas' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Mis listas de la compra</h2>
                  <p className="text-xs text-gray-500 mt-1">Organiza tus compras por ocasión o semana</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dbLists.map((list) => {
                  const listItems = dbItems.filter((i) => i.listId === list.id);
                  const inCartCount = listItems.filter((i) => i.inCart).length;
                  const isAllInCart = listItems.length > 0 && inCartCount === listItems.length;

                  return (
                    <div key={list.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex flex-col relative group">
                      <button 
                        type="button"
                        onClick={() => setListToDelete(list.id)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Eliminar lista"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>

                      <input 
                        type="text"
                        value={list.name}
                        onChange={(e) => updateListTitle(list.id, e.target.value)}
                        className="text-xl font-bold text-[#00703c] mb-4 pb-2 border-b border-transparent hover:border-gray-200 focus:border-[#00703c] focus:outline-none bg-transparent w-[90%] transition-colors"
                      />

                      <ul className="flex-1 space-y-2 mb-4 max-h-64 overflow-y-auto pr-1">
                        {listItems.length > 0 ? (
                          listItems.map((item) => (
                            <li key={item.id} className={`flex items-center justify-between text-sm group/item py-0.5 ${item.inCart ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                              <div className="flex items-start gap-1.5 flex-1 pr-2">
                                <span className={item.inCart ? 'text-gray-400' : 'text-[#e23000]'}>•</span>
                                <span className="font-medium">{item.name}</span>
                                {item.quantity > 1 && (
                                  <span className="text-xs text-gray-400">({item.quantity} {item.unit})</span>
                                )}
                              </div>
                              <button 
                                type="button"
                                onClick={() => removeProductFromList(item.id)}
                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-1 rounded cursor-pointer"
                                title="Eliminar producto"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </li>
                          ))
                        ) : (
                          <p className="text-gray-400 italic text-sm py-4 text-center">No hay productos en esta lista.</p>
                        )}
                      </ul>

                      <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-100">
                        <button 
                          type="button"
                          onClick={() => setListToAddProduct(list.id)}
                          className="text-sm font-semibold text-[#00703c] hover:text-green-800 flex items-center cursor-pointer"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          Añadir producto
                        </button>
                        <button 
                          type="button"
                          onClick={() => toggleCartStatus(list.id)}
                          disabled={listItems.length === 0}
                          className={`text-xs px-4 py-2 rounded-full font-bold transition-all flex items-center shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            isAllInCart 
                              ? 'bg-green-100 text-[#00703c] border border-green-200'
                              : 'bg-[#00703c] text-white hover:bg-green-800'
                          }`}
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                          {isAllInCart ? 'En el carrito' : 'Al carrito'}
                        </button>
                      </div>
                    </div>
                  );
                })}

                <button 
                  type="button"
                  onClick={handleAddList}
                  className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 hover:text-[#00703c] hover:border-[#00703c] hover:bg-green-50 transition-all min-h-[250px] group cursor-pointer"
                >
                  <div className="bg-white rounded-full p-4 shadow-xs mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <span className="font-semibold text-lg">Añadir lista</span>
                </button>
              </div>
            </div>
          )}
          
          {/* PESTAÑA: RECETAS (CONECTADAS A SQLITE CON BOTÓN Y MODAL DE CREACIÓN) */}
          {activeTab === 'Recetas' && (
            <div>
              {/* Controles de Recetas: Pestañas, Buscador y Botón Crear Receta */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 mb-8 pb-4 gap-4">
                {/* Submenú de Recetas: Guardados / Comunidad */}
                <div className="flex items-center space-x-8">
                  <span 
                    onClick={() => setActiveRecipeTab('Comunidad')}
                    className={`pb-1 text-lg font-bold cursor-pointer transition-colors hover:text-[#00703c] ${
                      activeRecipeTab === 'Comunidad' 
                        ? 'text-[#00703c] border-b-2 border-[#00703c]' 
                        : 'text-gray-500'
                    }`}
                  >
                    Comunidad ({dbRecipes.length})
                  </span>
                  <span 
                    onClick={() => setActiveRecipeTab('Guardados')}
                    className={`pb-1 text-lg font-bold cursor-pointer transition-colors hover:text-[#00703c] ${
                      activeRecipeTab === 'Guardados' 
                        ? 'text-[#00703c] border-b-2 border-[#00703c]' 
                        : 'text-gray-500'
                    }`}
                  >
                    Guardados ({savedRecipeIds.size})
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Buscador de Recetas */}
                  <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar por receta o ingrediente..."
                      value={recipeSearchQuery}
                      onChange={(e) => setRecipeSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-[#00703c] focus:ring-1 focus:ring-[#00703c] transition-colors bg-white text-sm"
                    />
                  </div>

                  {/* Botón para Crear Receta */}
                  <button
                    type="button"
                    onClick={() => setIsCreateRecipeOpen(true)}
                    className="flex items-center justify-center gap-2 px-5 py-2 bg-[#00703c] text-white rounded-full font-semibold text-sm hover:bg-[#005a30] transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Crear receta</span>
                  </button>
                </div>
              </div>

              {/* Grid de Recetas extraídas de SQLite */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedRecipes.length > 0 ? (
                  displayedRecipes.map((recipe) => (
                    <div key={recipe.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col group">
                      
                      {/* Imagen / Emoji de la Receta */}
                      <div className="w-full h-48 overflow-hidden relative bg-emerald-50">
                        <img 
                          src={recipe.image} 
                          alt={recipe.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          onError={(e) => {
                            // Si la imagen falla, mostrar imagen por defecto
                            (e.target as HTMLImageElement).src = DEFAULT_RECIPE_IMAGE;
                          }}
                        />
                        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs p-1.5 rounded-full text-lg shadow-xs">
                          {recipe.imageEmoji}
                        </span>
                        {recipe.prepTimeMin && (
                          <span className="absolute bottom-3 left-3 bg-black/60 text-white text-[11px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                            ⏱️ {recipe.prepTimeMin} min
                          </span>
                        )}
                      </div>
                      
                      {/* Información de la Receta */}
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-lg text-gray-800 leading-tight mb-1">{recipe.title}</h3>
                        <span className="text-sm font-medium text-gray-500 mb-3">{recipe.creator}</span>
                        <p className="text-sm text-gray-600 mb-5 flex-1 line-clamp-3">{recipe.description}</p>
                        
                        {/* Botón de Guardar/Guardado */}
                        <button
                          type="button"
                          onClick={() => toggleSaveRecipe(recipe.id)}
                          className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                            recipe.isSaved
                              ? 'bg-green-100 text-[#00703c] hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-700 hover:bg-[#00703c] hover:text-white'
                          }`}
                        >
                          <svg className="w-5 h-5" fill={recipe.isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={recipe.isSaved ? 1 : 2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                          {recipe.isSaved ? 'Guardado' : 'Guardar receta'}
                        </button>
                      </div>

                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-16 text-gray-500">
                    <p className="text-lg mb-2">No se encontraron recetas{recipeSearchQuery && ` para "${recipeSearchQuery}"`}.</p>
                    {activeRecipeTab === 'Guardados' && !recipeSearchQuery && (
                      <button 
                        type="button"
                        onClick={() => setActiveRecipeTab('Comunidad')}
                        className="mt-2 text-[#00703c] font-semibold hover:underline cursor-pointer"
                      >
                        Explorar recetas de la comunidad
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating AI Chatbot con sincronización bidireccional */}
      <ChatBot activeList={activeChatList} onIngredientAdded={loadDataFromBackend} />

      {/* --- MODAL CONFIRMACIÓN BORRAR LISTA --- */}
      {listToDelete !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar lista?</h3>
            <p className="text-gray-600 text-sm mb-6">Esta acción no se puede deshacer. Se eliminarán los productos de esta lista.</p>
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setListToDelete(null)} 
                className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={confirmDelete} 
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL AÑADIR PRODUCTO (CATÁLOGO DE MERCADONA) --- */}
      {listToAddProduct !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                autoFocus 
                placeholder="Buscar productos en Mercadona..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="flex-1 outline-none text-gray-700 bg-transparent text-sm"
              />
              <button 
                type="button"
                onClick={() => { setListToAddProduct(null); setSearchQuery(''); }} 
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto p-2 flex-1">
              {filteredProducts.length > 0 ? (
                <ul>
                  {filteredProducts.map((product, idx) => (
                    <li 
                      key={idx} 
                      onClick={() => addProductToList(product)} 
                      className="px-4 py-2.5 hover:bg-green-50 hover:text-[#00703c] cursor-pointer rounded-lg transition-colors flex justify-between items-center text-sm group"
                    >
                      <span>{product}</span>
                      <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 text-[#00703c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center text-gray-500 text-sm">
                  <p>No se encontraron productos con "{searchQuery}"</p>
                  <button
                    type="button"
                    onClick={() => addProductToList(searchQuery.trim())}
                    className="mt-3 text-xs bg-[#00703c] text-white px-3 py-1.5 rounded-lg hover:bg-green-800 transition-colors"
                  >
                    Añadir "{searchQuery}" como producto personalizado
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CREAR RECETA --- */}
      <CreateRecipeModal
        isOpen={isCreateRecipeOpen}
        onClose={() => setIsCreateRecipeOpen(false)}
        onCreated={handleRecipeCreated}
      />
    </div>
  );
}

export default App;