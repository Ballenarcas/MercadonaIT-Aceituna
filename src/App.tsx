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
  isUserCreated: boolean;
  category?: string;
  servings?: number;
  prepTimeMin?: number;
  ingredients: { name: string; quantity: number; unit: string }[];
}

function App() {
  const [activeTab, setActiveTab] = useState('Mis listas');

  // --- ESTADOS DE LISTAS E ITEMS ---
  const [dbLists, setDbLists] = useState<ShoppingList[]>([]);
  const [dbItems, setDbItems] = useState<ShoppingItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<string[]>(FALLBACK_AVAILABLE_PRODUCTS);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [listToAddProduct, setListToAddProduct] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const cartItems = useMemo(() => dbItems.filter((item) => item.inCart), [dbItems]);
  const cartTotal = useMemo(
    () => cartItems.reduce((total, item) => total + (item.estimatedPrice || 0) * item.quantity, 0),
    [cartItems]
  );

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

  // Recetas creadas por el usuario (editables)
  const [myCreatedRecipeIds, setMyCreatedRecipeIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('mercadona_my_created_recipes');
      if (saved) return new Set(JSON.parse(saved));
    } catch {
      // Ignorar error de parsing
    }
    return new Set<string>();
  });

  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [isCreateRecipeOpen, setIsCreateRecipeOpen] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);

  // Estado de expansión y selección de ingredientes
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [checkedIngredientsMap, setCheckedIngredientsMap] = useState<Record<string, Set<number>>>({});
  const [addingCartRecipeId, setAddingCartRecipeId] = useState<string | null>(null);
  const [cartFeedbackRecipeId, setCartFeedbackRecipeId] = useState<string | null>(null);

  // --- CARGA DE DATOS DESDE EL BACKEND ---
  const loadDataFromBackend = useCallback(async () => {
    try {
      const [remoteLists, remoteItems, remoteRecipes, remoteCatalog] = await Promise.all([
        api.getLists().catch(() => []),
        api.getItems().catch(() => []),
        api.getRecipes().catch(() => []),
        api.getCatalog().catch(() => []),
      ]);

      if (remoteLists && remoteLists.length > 0) {
        setDbLists(remoteLists);
      } else {
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
      console.error('Error al conectar con el backend:', e);
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
      setDbItems((prev) =>
        prev.map((i) => (i.listId === listId ? { ...i, inCart: true, completed: true } : i))
      );
      try {
        await api.moveAllToCart(listId);
      } catch (e) {
        console.warn('Error al mover todo al carrito en backend:', e);
      }
    } else {
      setDbItems((prev) =>
        prev.map((i) => (i.listId === listId ? { ...i, inCart: false, completed: false } : i))
      );
      for (const item of itemsInList) {
        api.toggleCart(item.id).catch(() => {});
      }
    }
  };

  const toggleItemCart = async (itemId: string) => {
    setDbItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, inCart: !item.inCart, completed: !item.inCart }
          : item
      )
    );
    try {
      await api.toggleCart(itemId);
    } catch (e) {
      console.warn('Error al actualizar el carrito en backend:', e);
    }
  };

  const handleChatItemsAdded = (createdItems: ShoppingItem[]) => {
    setDbItems((prev) => {
      const createdIds = new Set(createdItems.map((item) => item.id));
      return [...prev.filter((item) => !createdIds.has(item.id)), ...createdItems];
    });
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
    const strId = String(newRecipe.id);
    setSavedRecipeIds((prev) => new Set([...prev, strId]));
    setMyCreatedRecipeIds((prev) => {
      const next = new Set(prev).add(strId);
      try {
        localStorage.setItem('mercadona_my_created_recipes', JSON.stringify(Array.from(next)));
      } catch {
        // Ignorar
      }
      return next;
    });
    setActiveRecipeTab('Mis recetas');
  };

  // Callback cuando se actualiza una receta
  const handleRecipeUpdated = (updatedRecipe: Recipe) => {
    setDbRecipes((prev) =>
      prev.map((r) => (String(r.id) === String(updatedRecipe.id) ? updatedRecipe : r))
    );
    setRecipeToEdit(null);
  };

  const handleOpenEditRecipe = (recipe: DisplayRecipe) => {
    const fullRecipe = dbRecipes.find((r) => String(r.id) === String(recipe.id));
    if (fullRecipe) {
      setRecipeToEdit(fullRecipe);
    } else {
      setRecipeToEdit({
        id: String(recipe.id),
        name: recipe.title,
        description: recipe.description,
        category: recipe.category || 'comida',
        servings: recipe.servings || 2,
        prepTimeMin: recipe.prepTimeMin || 25,
        imageEmoji: recipe.imageEmoji || '🍽️',
        tags: '',
        ingredients: recipe.ingredients.map((ing, i) => ({
          id: `ing_${i}`,
          recipeId: String(recipe.id),
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit as any,
          categoryId: 'otros',
          isOptional: false,
        })),
        createdAt: Date.now(),
      });
    }
    setIsCreateRecipeOpen(true);
  };

  // Alternar checkbox de un ingrediente en la vista expandida
  const toggleIngredientCheck = (recipeId: string, index: number) => {
    setCheckedIngredientsMap((prev) => {
      const current = prev[recipeId] || new Set();
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return { ...prev, [recipeId]: next };
    });
  };

  // Añadir ingredientes seleccionados al carrito
  const handleAddRecipeIngredientsToCart = async (recipe: DisplayRecipe) => {
    const strId = String(recipe.id);
    const checked =
      checkedIngredientsMap[strId] !== undefined
        ? checkedIngredientsMap[strId]
        : new Set(recipe.ingredients.map((_, i) => i));

    const selected = recipe.ingredients.filter((_, idx) => checked.has(idx));
    if (selected.length === 0 || addingCartRecipeId) return;

    const targetListId = dbLists.length > 0 ? dbLists[0].id : 'default';
    setAddingCartRecipeId(strId);

    try {
      for (const ing of selected) {
        await api.createItem({
          listId: targetListId,
          name: ing.name,
          categoryId: 'otros',
          brand: 'Hacendado',
          quantity: ing.quantity || 1,
          unit: (ing.unit as any) || 'ud',
          inCart: true,
          priority: 'media',
        });
      }
      const remoteItems = await api.getItems();
      if (remoteItems) setDbItems(remoteItems);
      setCartFeedbackRecipeId(strId);
      setTimeout(() => setCartFeedbackRecipeId(null), 3000);
    } catch (e) {
      console.warn('Error al añadir ingredientes al carrito:', e);
      const newItems: ShoppingItem[] = selected.map((ing, i) => ({
        id: `cart_item_${Date.now()}_${i}`,
        listId: targetListId,
        name: ing.name,
        categoryId: 'otros',
        brand: 'Hacendado',
        quantity: ing.quantity || 1,
        unit: (ing.unit as any) || 'ud',
        completed: true,
        inCart: true,
        priority: 'media',
        createdAt: Date.now(),
      }));
      setDbItems((prev) => [...prev, ...newItems]);
      setCartFeedbackRecipeId(strId);
      setTimeout(() => setCartFeedbackRecipeId(null), 3000);
    } finally {
      setAddingCartRecipeId(null);
    }
  };

  // Conteo de recetas creadas por el usuario
  const myRecipesCount = useMemo(() => {
    return dbRecipes.filter(
      (r) =>
        myCreatedRecipeIds.has(String(r.id)) ||
        (r as unknown as { creator?: string }).creator === '@mi_cocina'
    ).length;
  }, [dbRecipes, myCreatedRecipeIds]);

  // Formateo de recetas a mostrar desde la base de datos
  const displayedRecipes: DisplayRecipe[] = useMemo(() => {
    const q = recipeSearchQuery.toLowerCase().trim();

    return dbRecipes
      .map((r) => {
        const strId = String(r.id);
        const isSaved = savedRecipeIds.has(strId);
        const isUserCreated =
          myCreatedRecipeIds.has(strId) ||
          (r as unknown as { creator?: string }).creator === '@mi_cocina';

        const image = RECIPE_IMAGE_MAP[r.name] || DEFAULT_RECIPE_IMAGE;
        const ingredients = (r.ingredients || []).map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
        }));

        return {
          id: r.id,
          title: r.name,
          creator: (r as unknown as { creator?: string }).creator || '@mercadona_chef',
          description: r.description || 'Receta saludable elaborada con productos de calidad de Mercadona.',
          image,
          imageEmoji: r.imageEmoji || '🍽️',
          isSaved,
          isUserCreated,
          category: r.category,
          servings: r.servings,
          prepTimeMin: r.prepTimeMin,
          ingredients,
        };
      })
      .filter((r) => {
        const matchesTab =
          activeRecipeTab === 'Mis recetas'
            ? r.isUserCreated
            : activeRecipeTab === 'Guardados'
            ? r.isSaved
            : true;

        const matchesSearch =
          !q ||
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (r.category && r.category.toLowerCase().includes(q));
        return matchesTab && matchesSearch;
      });
  }, [dbRecipes, savedRecipeIds, myCreatedRecipeIds, activeRecipeTab, recipeSearchQuery]);

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
      <Header cartCount={cartItems.length} onCartClick={() => setActiveTab('Mi carrito')} />

      {/* Menú inferior principal (Mis Listas y Recetas) */}
      <div className="w-full bg-white py-4 sm:py-6 flex items-center justify-center border-b border-gray-100 shadow-xs z-10 relative">
        <div className="flex items-center gap-4">
          {['Mis listas', 'Mi carrito', 'Recetas'].map((tab) => (
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
          
          {/* PESTAÑA: MIS LISTAS */}
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

          {activeTab === 'Mi carrito' && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Mi carrito</h2>
                  <p className="mt-1 text-xs text-gray-500">Productos añadidos desde tus listas y desde mercadITo</p>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-[#00703c]">
                  {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}
                </span>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                {cartItems.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {cartItems.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} {item.unit} · {item.listId}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-4">
                          <span className="font-semibold text-[#00703c]">
                            {((item.estimatedPrice || 0) * item.quantity).toFixed(2)} €
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleItemCart(item.id)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-[#00703c] hover:text-[#00703c]"
                          >
                            Devolver a la lista
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-10 text-center text-sm text-gray-500">Tu carrito está vacío.</p>
                )}
                <div className="mt-5 border-t border-gray-100 pt-4 text-right text-lg font-bold text-gray-800">
                  Total: <span className="text-[#00703c]">{cartTotal.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          )}
          
          {/* PESTAÑA: RECETAS */}
          {activeTab === 'Recetas' && (
            <div>
              {/* Controles de Recetas: Pestañas, Buscador y Botón Crear Receta */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 mb-8 pb-4 gap-4">
                {/* Submenú de Recetas: Mis recetas / Comunidad / Guardados */}
                <div className="flex items-center space-x-6 sm:space-x-8 overflow-x-auto">
                  <span 
                    onClick={() => setActiveRecipeTab('Mis recetas')}
                    className={`pb-1 text-base sm:text-lg font-bold cursor-pointer transition-colors hover:text-[#00703c] whitespace-nowrap ${
                      activeRecipeTab === 'Mis recetas' 
                        ? 'text-[#00703c] border-b-2 border-[#00703c]' 
                        : 'text-gray-500'
                    }`}
                  >
                    Mis recetas ({myRecipesCount})
                  </span>
                  <span 
                    onClick={() => setActiveRecipeTab('Comunidad')}
                    className={`pb-1 text-base sm:text-lg font-bold cursor-pointer transition-colors hover:text-[#00703c] whitespace-nowrap ${
                      activeRecipeTab === 'Comunidad' 
                        ? 'text-[#00703c] border-b-2 border-[#00703c]' 
                        : 'text-gray-500'
                    }`}
                  >
                    Comunidad ({dbRecipes.length})
                  </span>
                  <span 
                    onClick={() => setActiveRecipeTab('Guardados')}
                    className={`pb-1 text-base sm:text-lg font-bold cursor-pointer transition-colors hover:text-[#00703c] whitespace-nowrap ${
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
                    onClick={() => {
                      setRecipeToEdit(null);
                      setIsCreateRecipeOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-2 bg-[#00703c] text-white rounded-full font-semibold text-sm hover:bg-[#005a30] transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Crear receta</span>
                  </button>
                </div>
              </div>

              {/* Grid de Recetas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                {displayedRecipes.length > 0 ? (
                  displayedRecipes.map((recipe) => {
                    const strId = String(recipe.id);
                    const isExpanded = expandedRecipeId === strId;
                    const checkedSet =
                      checkedIngredientsMap[strId] !== undefined
                        ? checkedIngredientsMap[strId]
                        : new Set(recipe.ingredients.map((_, i) => i));

                    const isAddingThis = addingCartRecipeId === strId;
                    const hasSuccessFeedback = cartFeedbackRecipeId === strId;

                    return (
                      <div 
                        key={recipe.id} 
                        onClick={() => setExpandedRecipeId(isExpanded ? null : strId)}
                        className={`bg-white border rounded-xl overflow-hidden shadow-xs flex flex-col group transition-all duration-200 cursor-pointer ${
                          isExpanded ? 'border-[#00703c] ring-2 ring-[#00703c]/20' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* Imagen / Emoji de la Receta */}
                        <div className="w-full h-48 overflow-hidden relative bg-emerald-50">
                          <img 
                            src={recipe.image} 
                            alt={recipe.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            onError={(e) => {
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

                          {/* Indicador de clicar para expandir */}
                          <div className="absolute bottom-3 right-3 bg-white/90 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 shadow-xs">
                            <span>{isExpanded ? 'Contraer' : 'Ver ingredientes'}</span>
                            <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        
                        {/* Información de la Receta */}
                        <div className="p-5 flex flex-col flex-1">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-bold text-lg text-gray-800 leading-tight">{recipe.title}</h3>
                            {recipe.isUserCreated && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditRecipe(recipe);
                                }}
                                className="p-1 text-gray-400 hover:text-[#00703c] hover:bg-green-50 rounded-lg transition-colors cursor-pointer shrink-0"
                                title="Editar mi receta"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-medium text-gray-500">{recipe.creator}</span>
                            {recipe.isUserCreated && (
                              <span className="text-[10px] font-bold bg-green-100 text-[#00703c] px-2 py-0.5 rounded-full">
                                Creada por mí
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-3">{recipe.description}</p>
                          
                          {/* Botón de Guardar/Guardado */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSaveRecipe(recipe.id);
                            }}
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

                        {/* SECCIÓN EXPANDIDA: INGREDIENTES Y AÑADIR AL CARRITO */}
                        {isExpanded && (
                          <div 
                            onClick={(e) => e.stopPropagation()} 
                            className="border-t border-gray-100 p-4 bg-gray-50/80 space-y-3 cursor-default"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                                <span>Ingredientes</span>
                                <span className="bg-green-100 text-[#00703c] px-1.5 py-0.5 rounded-full text-[10px]">
                                  {recipe.ingredients.length}
                                </span>
                              </h4>
                              {recipe.servings && (
                                <span className="text-[11px] text-gray-500">
                                  {recipe.servings} raciones
                                </span>
                              )}
                            </div>

                            {recipe.ingredients.length > 0 ? (
                              <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {recipe.ingredients.map((ing, idx) => {
                                  const isChecked = checkedSet.has(idx);
                                  return (
                                    <li
                                      key={idx}
                                      onClick={() => toggleIngredientCheck(strId, idx)}
                                      className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors"
                                    >
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => {}}
                                          className="rounded text-[#00703c] focus:ring-[#00703c] cursor-pointer"
                                        />
                                        <span className={isChecked ? 'text-gray-800 font-medium' : 'text-gray-400 line-through'}>
                                          {ing.name}
                                        </span>
                                      </div>
                                      <span className="text-gray-500 font-mono text-[11px]">
                                        {ing.quantity} {ing.unit}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <p className="text-xs text-gray-400 italic py-1">No hay ingredientes detallados para esta receta.</p>
                            )}

                            {/* Botón para añadir ingredientes seleccionados al carrito */}
                            <button
                              type="button"
                              disabled={recipe.ingredients.length === 0 || isAddingThis}
                              onClick={() => handleAddRecipeIngredientsToCart(recipe)}
                              className={`w-full py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
                                hasSuccessFeedback
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-[#e23000] hover:bg-[#c52a00] text-white'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              {isAddingThis
                                ? 'Añadiendo al carrito...'
                                : hasSuccessFeedback
                                ? '¡Ingredientes en el carrito! ✓'
                                : 'Añadir al carrito'}
                            </button>
                          </div>
                        )}

                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-16 text-gray-500">
                    <p className="text-lg mb-2">
                      {activeRecipeTab === 'Mis recetas' && !recipeSearchQuery
                        ? 'Aún no has creado ninguna receta.'
                        : `No se encontraron recetas${recipeSearchQuery ? ` para "${recipeSearchQuery}"` : ''}.`}
                    </p>
                    {activeRecipeTab === 'Mis recetas' && !recipeSearchQuery && (
                      <button 
                        type="button"
                        onClick={() => {
                          setRecipeToEdit(null);
                          setIsCreateRecipeOpen(true);
                        }}
                        className="mt-2 text-[#00703c] font-semibold hover:underline cursor-pointer"
                      >
                        + Crear mi primera receta
                      </button>
                    )}
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
      <ChatBot
        activeList={activeChatList}
        lists={dbLists}
        onItemsAdded={handleChatItemsAdded}
        onIngredientAdded={loadDataFromBackend}
      />

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

      {/* --- MODAL CREAR / EDITAR RECETA --- */}
      <CreateRecipeModal
        isOpen={isCreateRecipeOpen}
        onClose={() => {
          setIsCreateRecipeOpen(false);
          setRecipeToEdit(null);
        }}
        onCreated={handleRecipeCreated}
        recipeToEdit={recipeToEdit}
        onUpdated={handleRecipeUpdated}
      />
    </div>
  );
}

export default App;