import React, { useState } from 'react';
import { X, Search, Plus, Sparkles, Check } from 'lucide-react';
import { POPULAR_MERCADONA_CATALOG } from '../data/mercadonaCatalog';
import { MERCADONA_CATEGORIES, getCategoryById } from '../data/categories';
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

  if (!isOpen) return null;

  const handleAdd = (product: CatalogProduct) => {
    onAddProduct(product);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  const filteredCatalog = POPULAR_MERCADONA_CATALOG.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === 'all' || item.categoryId === selectedCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-400 text-emerald-950 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                Catálogo Frecuente Mercadona
              </h2>
              <p className="text-xs text-emerald-100">
                Añade tus habituales (Hacendado, Bosque Verde, Deliplus) con 1 clic
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos (ej. Hummus, Guacamole, Leche...)"
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
          {filteredCatalog.map((prod) => {
            const cat = getCategoryById(prod.categoryId);
            const isJustAdded = addedIds[prod.id];

            return (
              <div
                key={prod.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs transition-all"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-slate-800 text-sm leading-tight truncate">
                    {prod.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-0.5">
                      {cat.emoji} {cat.name}
                    </span>
                    <span>·</span>
                    <span className="font-bold text-emerald-700">
                      {prod.typicalPrice.toFixed(2)}€
                    </span>
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
          })}

          {filteredCatalog.length === 0 && (
            <div className="col-span-2 text-center py-10 text-slate-400 text-sm">
              No se han encontrado productos que coincidan con la búsqueda.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Listo, volver a la lista
          </button>
        </div>
      </div>
    </div>
  );
};
