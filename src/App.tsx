import { useState } from 'react';
import { useShoppingList } from './hooks/useShoppingList';
import { Header } from './components/Header';
import { NavigationTabs } from './components/NavigationTabs';
import { ListsView } from './components/ListsView';
import { CartView } from './components/CartView';
import { BudgetSummary } from './components/BudgetSummary';
import { QuickAddBar } from './components/QuickAddBar';
import { FilterBar } from './components/FilterBar';
import { ItemCard } from './components/ItemCard';
import { EmptyState } from './components/EmptyState';
import { CatalogModal } from './components/CatalogModal';
import { ShareModal } from './components/ShareModal';
import { MapPin } from 'lucide-react';
import type { ActiveTab } from './types';

export function App() {
  const {
    lists,
    activeList,
    activeListId,
    setActiveListId,
    createList,
    deleteList,

    filteredListItems,
    filteredCartItems,
    groupedListItems,
    groupedCartItems,
    pendingListItems,
    cartItems,

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
    refreshBackend,

    addItem,
    addFromCatalog,
    toggleCart,
    updateItem,
    deleteItem,
    moveAllToCart,
    clearCart,
    resetToSample,
    generateWhatsAppShareText,
  } = useShoppingList();

  const [activeTab, setActiveTab] = useState<ActiveTab>('list');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');

  const isFiltered = Boolean(searchQuery || selectedCategory !== 'all' || filterStatus !== 'all');

  const handleClearFilter = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setFilterStatus('all');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onOpenCatalog={() => setIsCatalogOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onResetSample={resetToSample}
        isBackendConnected={isBackendConnected}
        onRefreshBackend={refreshBackend}
        lists={lists}
        activeListId={activeListId}
        onSelectList={setActiveListId}
        onOpenListsTab={() => setActiveTab('lists')}
      />

      {/* Navigation Tabs (Listas / Lista Activa / Carrito) */}
      <NavigationTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeList={activeList}
        listItemsCount={pendingListItems.length}
        cartItemsCount={cartItems.length}
        cartEstimated={stats.cartEstimated}
        listsCount={lists.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {/* TAB 1: APARTADO DE LISTAS */}
        {activeTab === 'lists' && (
          <ListsView
            lists={lists}
            activeListId={activeListId}
            onSelectList={setActiveListId}
            onCreateList={createList}
            onDeleteList={deleteList}
            onGoToShopping={() => setActiveTab('list')}
          />
        )}

        {/* TAB 2: LISTA DE COMPRA (PLANIFICACIÓN / PENDIENTES) */}
        {activeTab === 'list' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Budget & Progress Overview */}
            <BudgetSummary
              stats={stats}
              listName={activeList.name}
              onGoToCart={() => setActiveTab('cart')}
              onMoveAllToCart={moveAllToCart}
            />

            {/* Quick Add Product Bar */}
            <QuickAddBar onAddItem={addItem} />

            {/* Search & Category Filter Controls */}
            <FilterBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />

            {/* View Layout Toggle & Count */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                {sortBy === 'aisle' && (
                  <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    <MapPin className="w-3.5 h-3.5" />
                    Pasillos de tienda Mercadona
                  </span>
                )}
                {sortBy !== 'aisle' && (
                  <span className="text-slate-500">
                    {filteredListItems.length} {filteredListItems.length === 1 ? 'producto pendiente' : 'productos pendientes'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('grouped')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                    viewMode === 'grouped'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  Por Pasillo
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                    viewMode === 'list'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  Lista Simple
                </button>
              </div>
            </div>

            {/* Product Items Display */}
            {filteredListItems.length === 0 ? (
              <EmptyState
                onOpenCatalog={() => setIsCatalogOpen(true)}
                isFiltered={isFiltered}
                onClearFilter={handleClearFilter}
              />
            ) : viewMode === 'grouped' && sortBy === 'aisle' ? (
              /* Grouped by Mercadona Aisles */
              <div className="space-y-6">
                {groupedListItems.map(({ category, items: catItems }) => (
                  <section
                    key={category.id}
                    className="rounded-2xl p-4 bg-white border border-slate-200/90 shadow-xs"
                  >
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{category.emoji}</span>
                        <div>
                          <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-1.5 leading-none">
                            <span>{category.name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              Pasillo #{category.order}
                            </span>
                          </h2>
                          {category.description && (
                            <span className="text-[11px] text-slate-400 font-normal">
                              {category.description}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-xs text-slate-500 font-medium">
                        {catItems.length} pendiente{catItems.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {catItems.map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          mode="list"
                          onToggleCart={toggleCart}
                          onUpdate={updateItem}
                          onDelete={deleteItem}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              /* Flat List */
              <div className="space-y-2">
                {filteredListItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    mode="list"
                    onToggleCart={toggleCart}
                    onUpdate={updateItem}
                    onDelete={deleteItem}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CARRITO DE LA COMPRA (PRODUCTOS COGIDOS EN TIENDA) */}
        {activeTab === 'cart' && (
          <CartView
            cartItems={filteredCartItems}
            groupedCartItems={groupedCartItems}
            cartEstimated={stats.cartEstimated}
            totalEstimated={stats.totalEstimated}
            listName={activeList.name}
            onToggleCart={toggleCart}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
            onClearCart={clearCart}
            onBackToList={() => setActiveTab('list')}
            onOpenShare={() => setIsShareOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 mt-auto">
        <p>
          Mercadona Shopping List App · Separación de Listas y Carrito · React + FastAPI
        </p>
      </footer>

      {/* Modals */}
      <CatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onAddProduct={addFromCatalog}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        shareText={generateWhatsAppShareText()}
        items={pendingListItems.concat(cartItems)}
      />
    </div>
  );
}

export default App;
