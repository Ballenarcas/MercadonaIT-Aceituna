import React from 'react';
import { ListTodo, ShoppingCart, FolderHeart, ChefHat } from 'lucide-react';
import type { ActiveTab, ShoppingList } from '../types';

interface NavigationTabsProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeList: ShoppingList;
  listItemsCount: number;
  cartItemsCount: number;
  cartEstimated: number;
  listsCount: number;
  recipesCount?: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  setActiveTab,
  activeList,
  listItemsCount,
  cartItemsCount,
  cartEstimated,
  listsCount,
  recipesCount,
}) => {
  const tabCls = (tab: ActiveTab) =>
    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
      activeTab === tab
        ? 'bg-emerald-700 text-white shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const badgeCls = (tab: ActiveTab, variant: 'default' | 'amber' | 'green' = 'default') => {
    if (activeTab === tab) return 'text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-900/60 text-emerald-100';
    const colors = {
      default: 'bg-slate-200 text-slate-700',
      amber: 'bg-amber-100 text-amber-800',
      green: 'bg-emerald-100 text-emerald-800',
    };
    return `text-[10px] px-1.5 py-0.5 rounded-full font-bold ${colors[variant]}`;
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-[60px] sm:top-[68px] z-20 shadow-xs">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between sm:justify-start sm:gap-4 overflow-x-auto no-scrollbar py-2">

          {/* Tab 1: Mis Listas */}
          <button type="button" onClick={() => setActiveTab('lists')} className={tabCls('lists')}>
            <FolderHeart className="w-4 h-4" />
            <span>Mis Listas</span>
            <span className={badgeCls('lists')}>{listsCount}</span>
          </button>

          {/* Tab 2: Lista Activa */}
          <button type="button" onClick={() => setActiveTab('list')} className={tabCls('list')}>
            <ListTodo className="w-4 h-4" />
            <span className="truncate max-w-[120px] sm:max-w-[160px]">
              {activeList.emoji} {activeList.name}
            </span>
            {listItemsCount > 0 && (
              <span className={badgeCls('list', 'amber')}>{listItemsCount}</span>
            )}
          </button>

          {/* Tab 3: Carrito */}
          <button type="button" onClick={() => setActiveTab('cart')} className={tabCls('cart')}>
            <ShoppingCart className="w-4 h-4" />
            <span>Carrito</span>
            <div className="flex items-center gap-1">
              <span className={badgeCls('cart', 'green')}>{cartItemsCount}</span>
              {cartEstimated > 0 && (
                <span className="text-[11px] font-semibold text-emerald-600 hidden sm:inline">
                  ({cartEstimated.toFixed(2)}€)
                </span>
              )}
            </div>
          </button>

          {/* Tab 4: Recetas */}
          <button type="button" onClick={() => setActiveTab('recipes')} className={tabCls('recipes')}>
            <ChefHat className="w-4 h-4" />
            <span>Recetas</span>
            {recipesCount !== undefined && recipesCount > 0 && (
              <span className={badgeCls('recipes')}>{recipesCount}</span>
            )}
          </button>

        </div>
      </div>
    </nav>
  );
};
