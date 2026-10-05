import { useState } from 'react';
import Header from './components/Header';
import ChatBot from './components/ChatBot';

// Base de datos simulada de productos
const AVAILABLE_PRODUCTS = [
  'Leche entera', 'Leche semidesnatada', 'Huevos camperos', 'Pan de molde', 
  'Aceite de oliva virgen extra', 'Plátanos de Canarias', 'Vino tinto Rioja', 
  'Queso curado de oveja', 'Jamón serrano', 'Uvas sin semillas', 'Tomates pera', 
  'Cebollas', 'Ajos', 'Garbanzos', 'Pollo troceado', 'Arroz redondo', 'Macarrones'
];

// Base de datos simulada de recetas
const INITIAL_RECIPES = [
  {
    id: 101,
    title: 'Ensalada de garbanzos con pollo',
    creator: '@maria_cocina',
    description: 'Una ensalada fresca y llena de proteínas, ideal para el verano o llevar en tu tupper.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600',
    isSaved: true
  },
  {
    id: 102,
    title: 'Pasta al pesto de pistacho',
    creator: '@chef_juan',
    description: 'Receta rápida y deliciosa con un toque diferente de pistacho y albahaca fresca.',
    image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&q=80&w=600',
    isSaved: false
  },
  {
    id: 103,
    title: 'Lentejas tradicionales',
    creator: '@abuela_ana',
    description: 'Las lentejas de toda la vida, con su chorizo, patata y verduritas a fuego lento.',
    image: 'https://images.unsplash.com/photo-1548946522-4a3ce3e49522?auto=format&fit=crop&q=80&w=600',
    isSaved: true
  },
  {
    id: 104,
    title: 'Tostada de aguacate y huevo',
    creator: '@fit_breakfast',
    description: 'El desayuno perfecto para empezar el día con energía y grasas saludables.',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=600',
    isSaved: false
  }
];

function App() {
  const [activeTab, setActiveTab] = useState('Mis listas');

  // --- ESTADOS DE LISTAS ---
  const [myLists, setMyLists] = useState([
    {
      id: 1,
      title: 'Compra semanal',
      products: ['Leche entera', 'Huevos camperos', 'Pan de molde'],
      inCart: false
    },
    {
      id: 2,
      title: 'Cena especial',
      products: ['Vino tinto Rioja', 'Queso curado de oveja'],
      inCart: false
    }
  ]);
  const [listToDelete, setListToDelete] = useState<number | null>(null);
  const [listToAddProduct, setListToAddProduct] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- ESTADOS DE RECETAS ---
  const [activeRecipeTab, setActiveRecipeTab] = useState('Guardados');
  const [recipes, setRecipes] = useState(INITIAL_RECIPES);
  const [recipeSearchQuery, setRecipeSearchQuery] = useState(''); // Nuevo estado para buscar recetas

  // --- LÓGICA DE LISTAS ---
  const handleAddList = () => {
    const newList = {
      id: Date.now(),
      title: 'Nueva lista',
      products: [],
      inCart: false
    };
    setMyLists([...myLists, newList]);
  };

  const updateListTitle = (id: number, newTitle: string) => {
    setMyLists(myLists.map(list => list.id === id ? { ...list, title: newTitle } : list));
  };

  const confirmDelete = () => {
    if (listToDelete !== null) {
      setMyLists(myLists.filter(list => list.id !== listToDelete));
      setListToDelete(null);
    }
  };

  const toggleCartStatus = (id: number) => {
    setMyLists(myLists.map(list => list.id === id ? { ...list, inCart: true } : list));
  };

  // --- LÓGICA DE PRODUCTOS ---
  const filteredProducts = AVAILABLE_PRODUCTS.filter(product => 
    product.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addProductToList = (product: string) => {
    if (listToAddProduct !== null) {
      setMyLists(myLists.map(list => {
        if (list.id === listToAddProduct && !list.products.includes(product)) {
          return { ...list, products: [...list.products, product], inCart: false };
        }
        return list;
      }));
      setListToAddProduct(null);
      setSearchQuery('');
    }
  };

  const removeProductFromList = (listId: number, productToRemove: string) => {
    setMyLists(myLists.map(list => {
      if (list.id === listId) {
        return { ...list, products: list.products.filter(p => p !== productToRemove) };
      }
      return list;
    }));
  };

  // --- LÓGICA DE RECETAS ---
  const toggleSaveRecipe = (recipeId: number) => {
    setRecipes(recipes.map(recipe => 
      recipe.id === recipeId ? { ...recipe, isSaved: !recipe.isSaved } : recipe
    ));
  };

  // Filtramos las recetas a mostrar según la pestaña activa (Guardados/Comunidad) Y la barra de búsqueda
  const displayedRecipes = recipes.filter(recipe => {
    const matchesTab = activeRecipeTab === 'Comunidad' ? true : recipe.isSaved;
    const matchesSearch = recipe.title.toLowerCase().includes(recipeSearchQuery.toLowerCase()) || 
                          recipe.description.toLowerCase().includes(recipeSearchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col relative">
      <Header />

      {/* Menú inferior principal (Solo Mis Listas y Recetas) */}
      <div className="w-full bg-white py-6 flex items-center justify-center gap-6 border-b border-gray-100 shadow-sm z-10 relative">
        {['Mis listas', 'Recetas'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-2.5 font-semibold rounded-lg transition-colors shadow-sm ${
              activeTab === tab 
                ? 'bg-[#00703c] text-white border border-[#00703c]' 
                : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-[#00703c] hover:text-white hover:border-[#00703c]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <main className="flex-1 bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* PESTAÑA: MIS LISTAS */}
          {activeTab === 'Mis listas' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Mis listas de la compra</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {myLists.map((list) => (
                  <div key={list.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col relative group">
                    <button 
                      onClick={() => setListToDelete(list.id)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <input 
                      type="text"
                      value={list.title}
                      onChange={(e) => updateListTitle(list.id, e.target.value)}
                      className="text-xl font-bold text-[#00703c] mb-4 pb-2 border-b border-transparent hover:border-gray-200 focus:border-[#00703c] focus:outline-none bg-transparent w-[90%] transition-colors"
                    />

                    <ul className="flex-1 space-y-2 mb-4">
                      {list.products.length > 0 ? (
                        list.products.map((product, index) => (
                          <li key={index} className="text-gray-600 flex items-center justify-between text-sm group/item">
                            <div className="flex items-start">
                              <span className="text-[#e23000] mr-2 mt-0.5">•</span>
                              {product}
                            </div>
                            <button 
                              onClick={() => removeProductFromList(list.id, product)}
                              className="text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-1 rounded"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </li>
                        ))
                      ) : (
                        <p className="text-gray-400 italic text-sm">No hay productos en esta lista.</p>
                      )}
                    </ul>

                    <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-50">
                      <button 
                        onClick={() => setListToAddProduct(list.id)}
                        className="text-sm font-semibold text-[#00703c] hover:text-green-800 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Añadir producto
                      </button>
                      <button 
                        onClick={() => toggleCartStatus(list.id)}
                        disabled={list.products.length === 0}
                        className={`text-xs px-4 py-2 rounded-full font-bold transition-all flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                          list.inCart 
                            ? 'bg-green-100 text-[#00703c] border border-green-200'
                            : 'bg-[#00703c] text-white hover:bg-green-800'
                        }`}
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        {list.inCart ? 'Añadido' : 'Al carrito'}
                      </button>
                    </div>
                  </div>
                ))}

                <button 
                  onClick={handleAddList}
                  className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 hover:text-[#00703c] hover:border-[#00703c] hover:bg-green-50 transition-all min-h-[250px] group"
                >
                  <div className="bg-white rounded-full p-4 shadow-sm mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <span className="font-semibold text-lg">Añadir lista</span>
                </button>
              </div>
            </div>
          )}
          
          {/* PESTAÑA: RECETAS */}
          {activeTab === 'Recetas' && (
            <div>
              
              {/* Controles de Recetas: Pestañas y Buscador */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 mb-8 pb-4 gap-4">
                {/* Submenú de Recetas: Guardados / Comunidad */}
                <div className="flex items-center space-x-8">
                  <span 
                    onClick={() => setActiveRecipeTab('Guardados')}
                    className={`pb-1 text-lg font-bold cursor-pointer transition-colors hover:text-[#00703c] ${
                      activeRecipeTab === 'Guardados' 
                        ? 'text-[#00703c] border-b-2 border-[#00703c]' 
                        : 'text-gray-500'
                    }`}
                  >
                    Guardados
                  </span>
                  <span 
                    onClick={() => setActiveRecipeTab('Comunidad')}
                    className={`pb-1 text-lg font-bold cursor-pointer transition-colors hover:text-[#00703c] ${
                      activeRecipeTab === 'Comunidad' 
                        ? 'text-[#00703c] border-b-2 border-[#00703c]' 
                        : 'text-gray-500'
                    }`}
                  >
                    Comunidad
                  </span>
                </div>

                {/* Buscador de Recetas */}
                <div className="relative w-full md:w-80">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por receta o palabra clave..."
                    value={recipeSearchQuery}
                    onChange={(e) => setRecipeSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-[#00703c] focus:ring-1 focus:ring-[#00703c] transition-colors bg-white text-sm"
                  />
                </div>
              </div>

              {/* Grid de Recetas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedRecipes.length > 0 ? (
                  displayedRecipes.map((recipe) => (
                    <div key={recipe.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col group">
                      
                      {/* Imagen de la Receta */}
                      <div className="w-full h-48 overflow-hidden">
                        <img 
                          src={recipe.image} 
                          alt={recipe.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      </div>
                      
                      {/* Información de la Receta */}
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-lg text-gray-800 leading-tight mb-1">{recipe.title}</h3>
                        <span className="text-sm font-medium text-gray-500 mb-3">{recipe.creator}</span>
                        <p className="text-sm text-gray-600 mb-5 flex-1">{recipe.description}</p>
                        
                        {/* Botón de Guardar/Guardado */}
                        <button
                          onClick={() => toggleSaveRecipe(recipe.id)}
                          className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
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
                        onClick={() => setActiveRecipeTab('Comunidad')}
                        className="mt-2 text-[#00703c] font-semibold hover:underline"
                      >
                        Explorar la comunidad
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <ChatBot />

      {/* --- MODAL CONFIRMACIÓN BORRAR LISTA --- */}
      {listToDelete !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar lista?</h3>
            <p className="text-gray-600 text-sm mb-6">Esta acción no se puede deshacer. Todos los productos de esta lista se perderán.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setListToDelete(null)} className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL AÑADIR PRODUCTO --- */}
      {listToAddProduct !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" autoFocus placeholder="Buscar productos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 outline-none text-gray-700 bg-transparent"/>
              <button onClick={() => { setListToAddProduct(null); setSearchQuery(''); }} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="overflow-y-auto p-2 flex-1">
              {filteredProducts.length > 0 ? (
                <ul>
                  {filteredProducts.map((product, idx) => (
                    <li key={idx} onClick={() => addProductToList(product)} className="px-4 py-3 hover:bg-green-50 hover:text-[#00703c] cursor-pointer rounded-lg transition-colors flex justify-between items-center group">
                      {product}
                      <svg className="w-5 h-5 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">No se encontraron productos con "{searchQuery}"</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;