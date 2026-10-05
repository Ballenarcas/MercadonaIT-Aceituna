import React from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';

interface BudgetSummaryProps {
  stats: {
    totalItems: number;
    listItemsCount: number;
    cartItemsCount: number;
    totalEstimated: number;
    listEstimated: number;
    cartEstimated: number;
    progressPercentage: number;
  };
  listName: string;
  onGoToCart: () => void;
  onMoveAllToCart: () => void;
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  stats,
  listName,
  onGoToCart,
  onMoveAllToCart,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 mb-5 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        {/* Left: Cart Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Lista: {listName}
            </span>
            <div className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-1.5">
              <span>{stats.cartItemsCount} de {stats.totalItems} en el carrito</span>
            </div>
          </div>
        </div>

        {/* Right: Price Breakdown */}
        <div className="flex items-center gap-4 text-right">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              En Carrito
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 leading-tight">
              {stats.cartEstimated.toFixed(2)} <span className="text-xs font-semibold">€</span>
            </div>
          </div>

          <div className="border-l border-slate-100 pl-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Previsto
            </span>
            <div className="text-base sm:text-lg font-bold text-slate-500 leading-tight">
              {stats.totalEstimated.toFixed(2)} <span className="text-xs font-normal">€</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-3">
        <div
          className="bg-emerald-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${stats.progressPercentage}%` }}
        />
      </div>

      {/* Footer Details & Action to Open Cart */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Por comprar: <strong>{stats.listItemsCount}</strong> ({stats.listEstimated.toFixed(2)}€)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>En carro: <strong>{stats.cartItemsCount}</strong> ({stats.cartEstimated.toFixed(2)}€)</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {stats.listItemsCount > 0 && (
            <button
              type="button"
              onClick={onMoveAllToCart}
              className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 py-1 px-2 rounded hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Meter todo al carro
            </button>
          )}

          <button
            type="button"
            onClick={onGoToCart}
            className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs"
          >
            <span>Ver Carrito</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
