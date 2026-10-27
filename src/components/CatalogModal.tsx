import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Plus, Sparkles, Check, RefreshCw, Loader2, ExternalLink } from 'lucide-react';
import { POPULAR_MERCADONA_CATALOG } from '../data/mercadonaCatalog';
import { MERCADONA_CATEGORIES, getCategoryById } from '../data/categories';
import { api } from '../services/api';
import type { CatalogProduct } from '../types';

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: CatalogProduct) => void;
}

export const CatalogModal: React.FC<CatalogModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [catalogItems, setCatalogItems] = useState<CatalogProduct[]>(POPULAR_MERCADONA_CATALOG);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [hasRealProducts, setHasRealProducts] = useState(false);

  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await api.getCatalog(search || undefined, selectedCat);
      if (items && items.length > 0) {
        setCatalogItems(items);
        setHasRealProducts(items.some((i) => i.thumbnail || i.bulkPrice));
      }
    } catch {
      // Keep existing catalog items if fetch fails
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCat]);

  const filteredItems = React.useMemo(() => {
    return catalogItems.filter((item) => {
      const matchSearch =
        !search.trim() ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.brand.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCat === 'all' || item.categoryId === selectedCat;
      return matchSearch && matchCat;
    });
  }, [catalogItems, search, selectedCat]);

  useEffect(() => {
    if (isOpen) {
      const debounce = setTimeout(loadCatalog, 300);
      return () => clearTimeout(debounce);
    }
  }, [isOpen, loadCatalog]);

  const handleSyncMercadona = async () => {
    setIsSyncing(true);
    setSyncStatus('Extrayendo productos reales de Mercadona...');
    try {
      const res = await api.syncMercadonaCatalog();
      setSyncStatus(`¡Sincronizado! ${res.productsScraped} productos cargados.`);
      await loadCatalog();
      setTimeout(() => setSyncStatus(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con la API de Mercadona';
      setSyncStatus(`Error: ${msg}`);
      setTimeout(() => setSyncStatus(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  const handleAdd = (product: CatalogProduct) => {
    onAddProduct(product);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-emerald-950 rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight flex items-center gap-2">
                <span>Catálogo Frecuente Mercadona</span>
                {hasRealProducts && (
                  <span className="text-[10px] bg-emerald-900/70 text-emerald-100 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                    En Vivo
                  </span>
                )}
              </h2>
              <p className="text-xs text-emerald-100">
                Productos reales de Mercadona (Hacendado, Bosque Verde, Deliplus)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncMercadona}
              disabled={isSyncing}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Descargar y actualizar el catálogo oficial con productos reales de Mercadona"
            >
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>{isSyncing ? 'Sincronizando…' : 'Scrapear Mercadona'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sync notification banner */}
        {syncStatus && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 flex items-center justify-between">
            <span>{syncStatus}</span>
          </div>
        )}

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos reales (ej. Aceite de oliva, Salmón, Hummus, Leche...)"
              className="w-full bg-white text-slate-800 text-sm pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedCat('all')}
              className={`shrink-0 px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                selectedCat === 'all'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Todos
            </button>
            {MERCADONA_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`shrink-0 px-2.5 py-1 rounded-lg font-medium cursor-pointer flex items-center gap-1 ${
                  selectedCat === cat.id
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {isLoading && filteredItems.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
              <p className="text-xs">Cargando catálogo...</p>
            </div>
          ) : (
            filteredItems.map((prod) => {
              const cat = getCategoryById(prod.categoryId);
              const isJustAdded = addedIds[prod.id];

              return (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs transition-all gap-2"
                >
                  {/* Thumbnail / Emoji */}
                  {prod.thumbnail ? (
                    <img
                      src={prod.thumbnail}
                      alt={prod.name}
                      className="w-12 h-12 rounded-lg object-contain bg-slate-50 border border-slate-100 shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center text-lg shrink-0">
                      {cat.emoji}
                    </div>
                  )}

                  <div className="min-w-0 flex-1 pr-1">
                    <div className="font-semibold text-slate-800 text-xs sm:text-sm leading-tight truncate">
                      {prod.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 flex-wrap">
                      <span className="font-bold text-emerald-700">
                        {prod.typicalPrice.toFixed(2)}€
                      </span>
                      {prod.packaging && (
                        <span className="text-slate-400">· {prod.packaging}</span>
                      )}
                      {prod.bulkPrice && (
                        <span className="text-slate-400">
                          ({prod.bulkPrice.toFixed(2)}€/{prod.defaultUnit === 'litro' ? 'L' : 'kg'})
                        </span>
                      )}
                      {prod.shareUrl && (
                        <a
                          href={prod.shareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-800"
                          title="Ver en Mercadona oficial"
                        >
                          <ExternalLink className="w-3 h-3 inline" />
                        </a>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdd(prod)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      isJustAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-200 hover:border-emerald-600'
                    }`}
                  >
                    {isJustAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Añadido
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Añadir
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}

          {!isLoading && filteredItems.length === 0 && (
            <div className="col-span-2 text-center py-10 text-slate-400 text-sm">
              No se han encontrado productos que coincidan con la búsqueda.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleSyncMercadona}
            disabled={isSyncing}
            className="sm:hidden flex items-center gap-1 px-3 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sincronizar</span>
          </button>
          <div className="ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Listo, volver a la lista
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
