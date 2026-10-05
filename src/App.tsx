import { useState } from 'react';
import { useShoppingList } from './hooks/useShoppingList';
import { Header } from './components/Header';
import { BudgetSummary } from './components/BudgetSummary';
import { QuickAddBar } from './components/QuickAddBar';
import { FilterBar } from './components/FilterBar';
import { ItemCard } from './components/ItemCard';
import { EmptyState } from './components/EmptyState';
import { CatalogModal } from './components/CatalogModal';
import { ShareModal } from './components/ShareModal';
import { MapPin, CheckCircle2 } from 'lucide-react';

export function App() {
  const {
    items,
    filteredItems,
    groupedByCategory,
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
    toggleItem,
    updateItem,
    deleteItem,
    clearCompleted,
    resetToSample,
    generateWhatsAppShareText,
  } = useShoppingList();

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
      {/* Top Header with FastAPI Status */}
      <Header
        onOpenCatalog={() => setIsCatalogOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onResetSample={resetToSample}
        onClearCompleted={clearCompleted}
        completedCount={stats.completedItems}
        isBackendConnected={isBackendConnected}
        onRefreshBackend={refreshBackend}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {/* Budget & Progress Overview */}
        <BudgetSummary stats={stats} />

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

        {/* View Layout Toggle (Ruta de tienda vs Lista plana) */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            {sortBy === 'aisle' && (
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <MapPin className="w-3.5 h-3.5" />
                Ordenado por recorrido de supermercado
              </span>
            )}
            {sortBy !== 'aisle' && (
              <span className="text-slate-500">
                {filteredItems.length} {filteredItems.length === 1 ? 'producto' : 'productos'} encontrados
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs">
            <button
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
        {filteredItems.length === 0 ? (
          <EmptyState
            onOpenCatalog={() => setIsCatalogOpen(true)}
            isFiltered={isFiltered}
            onClearFilter={handleClearFilter}
          />
        ) : viewMode === 'grouped' && sortBy === 'aisle' ? (
          /* Grouped by Mercadona Aisles */
          <div className="space-y-6">
            {groupedByCategory.map(({ category, items: catItems }) => {
              const pendingInCat = catItems.filter((i) => !i.completed).length;
              const allDoneInCat = pendingInCat === 0 && catItems.length > 0;

              return (
                <section
                  key={category.id}
                  className={`rounded-2xl p-4 transition-all border ${
                    allDoneInCat
                      ? 'bg-slate-50/70 border-slate-200/80 opacity-75'
                      : 'bg-white/80 border-slate-200/90 shadow-xs'
                  }`}
                >
                  {/* Category Header */}
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

                    <div className="text-xs font-semibold text-slate-500">
                      {allDoneInCat ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Pasillo listo
                        </span>
                      ) : (
                        <span>{pendingInCat} pendiente{pendingInCat > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>

                  {/* Category Items */}
                  <div className="space-y-2">
                    {catItems.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onToggle={toggleItem}
                        onUpdate={updateItem}
                        onDelete={deleteItem}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          /* Flat List */
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onToggle={toggleItem}
                onUpdate={updateItem}
                onDelete={deleteItem}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 mt-auto">
        <p>
          Mercadona Shopping List App · Frontend React TypeScript + Backend FastAPI
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
        items={items}
      />
    </div>
  );
}

export default App;
