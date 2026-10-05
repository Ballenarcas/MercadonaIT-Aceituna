import React from 'react';
import type { ShoppingItem } from '../types';
import { getCategoryById } from '../data/categories';
import { Trash2, Plus, Minus, Check, AlertCircle } from 'lucide-react';

interface ItemCardProps {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ShoppingItem>) => void;
  onDelete: (id: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onToggle,
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
        item.completed
          ? 'bg-slate-50/80 border-slate-200 opacity-60'
          : 'bg-white border-slate-200/90 shadow-sm hover:border-emerald-300 hover:shadow'
      }`}
    >
      {/* Left: Checkbox & Info */}
      <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
        <button
          type="button"
          onClick={() => onToggle(item.id)}
          className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
            item.completed
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'border-slate-300 hover:border-emerald-500 bg-white'
          }`}
          aria-label={item.completed ? 'Desmarcar' : 'Marcar como comprado'}
        >
          {item.completed && <Check className="w-4 h-4 stroke-[3]" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span
              className={`text-sm sm:text-base font-semibold transition-all break-words ${
                item.completed ? 'line-through text-slate-500 font-normal' : 'text-slate-900'
              }`}
            >
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
            {item.priority === 'alta' && !item.completed && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                <AlertCircle className="w-3 h-3" /> Urgente
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
            disabled={item.quantity <= 1 || item.completed}
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
            disabled={item.completed}
            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-white transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Estimated Price */}
        {totalItemPrice !== null && (
          <div className="text-right min-w-[50px] hidden sm:block">
            <span
              className={`text-xs sm:text-sm font-bold ${
                item.completed ? 'text-slate-400 line-through' : 'text-emerald-700'
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
