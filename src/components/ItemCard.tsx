import React from 'react';
import type { ShoppingItem } from '../types';
import { getCategoryById } from '../data/categories';
import { Trash2, Plus, Minus, ShoppingCart, RotateCcw, AlertCircle, Check } from 'lucide-react';

interface ItemCardProps {
  item: ShoppingItem;
  mode?: 'list' | 'cart';
  onToggleCart: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ShoppingItem>) => void;
  onDelete: (id: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  mode = 'list',
  onToggleCart,
  onUpdate,
  onDelete,
}) => {
  const category = getCategoryById(item.categoryId);
  const totalItemPrice = item.estimatedPrice ? item.estimatedPrice * item.quantity : null;

  const handleIncrement = () => {
    onUpdate(item.id, { quantity: item.quantity + 1 });
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdate(item.id, { quantity: item.quantity - 1 });
    }
  };

  const getBrandBadge = (brand: string) => {
    switch (brand) {
      case 'Hacendado':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Bosque Verde':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Deliplus':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'Compy':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      className={`group flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all duration-200 ${
        item.inCart && mode === 'cart'
          ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400 shadow-xs'
          : 'bg-white border-slate-200/90 shadow-sm hover:border-emerald-300 hover:shadow'
      }`}
    >
      {/* Left: Quick Action Button & Info */}
      <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
        {mode === 'list' ? (
          <button
            type="button"
            onClick={() => onToggleCart(item.id)}
            className="mt-0.5 shrink-0 px-2.5 py-1.5 rounded-lg border border-emerald-600 bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="Meter este producto al carrito"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Al Carrito</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onToggleCart(item.id)}
            className="mt-0.5 shrink-0 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-800 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
            title="Sacar del carrito y devolver a la lista"
          >
            <RotateCcw className="w-3 h-3 text-amber-600" />
            <span className="hidden sm:inline">A la lista</span>
          </button>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="text-sm sm:text-base font-semibold text-slate-900 break-words">
              {item.name}
            </span>

            {/* Brand Badge */}
            {item.brand && item.brand !== 'General' && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getBrandBadge(
                  item.brand
                )}`}
              >
                {item.brand}
              </span>
            )}

            {/* High Priority Badge */}
            {item.priority === 'alta' && !item.inCart && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                <AlertCircle className="w-3 h-3" /> Urgente
              </span>
            )}

            {mode === 'cart' && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                <Check className="w-3 h-3" /> En carro
              </span>
            )}
          </div>

          {/* Notes or Category Subtitle */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span>{category.emoji}</span>
              <span className="text-slate-600 font-medium">{category.name}</span>
            </span>

            {item.notes && (
              <span className="text-slate-400 italic truncate max-w-[200px]">
                "{item.notes}"
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Quantity Stepper, Price & Delete */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Quantity Controls */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={item.quantity <= 1}
            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-white transition-colors cursor-pointer"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="px-2 text-xs sm:text-sm font-bold text-slate-800 min-w-[32px] text-center">
            {item.quantity} <span className="text-[10px] font-normal text-slate-500">{item.unit}</span>
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded hover:bg-white transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Estimated Price */}
        {totalItemPrice !== null && (
          <div className="text-right min-w-[50px] hidden sm:block">
            <span
              className={`text-xs sm:text-sm font-bold ${
                item.inCart ? 'text-emerald-700' : 'text-slate-700'
              }`}
            >
              {totalItemPrice.toFixed(2)}€
            </span>
          </div>
        )}

        {/* Delete button */}
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
          title="Eliminar producto"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
