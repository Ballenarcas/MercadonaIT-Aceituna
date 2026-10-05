import React from 'react';
import { ShoppingCart, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onOpenCatalog: () => void;
  isFiltered: boolean;
  onClearFilter: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onOpenCatalog,
  isFiltered,
  onClearFilter,
}) => {
  return (
    <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
      <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <ShoppingCart className="w-8 h-8" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
        {isFiltered ? 'No hay productos con este filtro' : 'Tu lista está vacía'}
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-5">
        {isFiltered
          ? 'Prueba a cambiar los filtros de búsqueda o sección para ver otros artículos.'
          : 'Escribe un producto en la barra superior o explora nuestro catálogo de productos más populares de Mercadona.'}
      </p>

      {isFiltered ? (
        <button
          onClick={onClearFilter}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer"
        >
          Limpiar filtros
        </button>
      ) : (
        <button
          onClick={onOpenCatalog}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          Explorar catálogo frecuente
        </button>
      )}
    </div>
  );
};
