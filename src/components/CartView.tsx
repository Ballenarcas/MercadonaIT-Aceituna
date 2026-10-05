import React from 'react';
import { ShoppingCart, ArrowLeft, Trash2, CheckCircle2, Share2, Sparkles } from 'lucide-react';
import type { ShoppingItem, Category } from '../types';
import { ItemCard } from './ItemCard';

interface CartViewProps {
  cartItems: ShoppingItem[];
  groupedCartItems: { category: Category; items: ShoppingItem[] }[];
  cartEstimated: number;
  totalEstimated: number;
  listName: string;
  onToggleCart: (id: string) => void;
  onUpdateItem: (id: string, updates: Partial<ShoppingItem>) => void;
  onDeleteItem: (id: string) => void;
  onClearCart: () => void;
  onBackToList: () => void;
  onOpenShare: () => void;
}

export const CartView: React.FC<CartViewProps> = ({
  cartItems,
  groupedCartItems,
  cartEstimated,
  totalEstimated,
  listName,
  onToggleCart,
  onUpdateItem,
  onDeleteItem,
  onClearCart,
  onBackToList,
  onOpenShare,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cart Summary Banner */}
      <div className="bg-emerald-800 text-white rounded-2xl p-5 shadow-sm border border-emerald-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-bold text-xl shadow-xs">
              <ShoppingCart className="w-6 h-6 text-emerald-900" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                Carrito de la Compra · {listName}
              </span>
              <h2 className="text-xl font-black text-white">
                {cartItems.length} {cartItems.length === 1 ? 'artículo en el carro' : 'artículos en el carro'}
              </h2>
            </div>
          </div>

          <div className="text-left sm:text-right bg-emerald-900/60 p-3 rounded-xl border border-emerald-700/50">
            <span className="text-[11px] font-semibold text-emerald-300 block">Total en Caja (Estimado)</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-300 leading-none mt-0.5">
              {cartEstimated.toFixed(2)} <span className="text-base text-amber-200 font-semibold">€</span>
            </div>
            {totalEstimated > cartEstimated && (
              <span className="text-[11px] text-emerald-200/80 block mt-1">
                De un total previsto de {totalEstimated.toFixed(2)}€
              </span>
            )}
          </div>
        </div>

        {/* Quick Cart Actions */}
        <div className="mt-4 pt-4 border-t border-emerald-700 flex flex-wrap items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={onBackToList}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-emerald-100 hover:text-white font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a la lista de pendientes</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenShare}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-emerald-100 hover:text-white font-medium transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir Carro</span>
            </button>

            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-900/40 hover:bg-rose-800 text-rose-200 hover:text-white rounded-lg font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar Carrito</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cart Content */}
      {cartItems.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">
            Tu carrito está vacío todavía
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-5">
            A medida que vayas cogiendo los productos en el supermercado, pulsa "Meter al Carrito" en tu lista para llevar el control aquí.
          </p>
          <button
            type="button"
            onClick={onBackToList}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ir a la lista de la compra</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedCartItems.map(({ category, items: catItems }) => (
            <section
              key={category.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs"
            >
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.emoji}</span>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{category.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      Pasillo #{category.order}
                    </span>
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {catItems.length} {catItems.length === 1 ? 'artículo' : 'artículos'}
                </span>
              </div>

              <div className="space-y-2">
                {catItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    mode="cart"
                    onToggleCart={onToggleCart}
                    onUpdate={onUpdateItem}
                    onDelete={onDeleteItem}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
