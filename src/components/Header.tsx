import React from 'react';
import { Share2, PlusCircle, RotateCcw, Server } from 'lucide-react';
import type { ShoppingList } from '../types';

interface HeaderProps {
  onOpenCatalog: () => void;
  onOpenShare: () => void;
  onResetSample: () => void;
  isBackendConnected: boolean | null;
  onRefreshBackend: () => void;
  lists: ShoppingList[];
  activeListId: string;
  onSelectList: (id: string) => void;
  onOpenListsTab: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCatalog,
  onOpenShare,
  onResetSample,
  isBackendConnected,
  onRefreshBackend,
  lists,
  activeListId,
  onSelectList,
  onOpenListsTab,
}) => {
  return (
    <header className="bg-emerald-700 text-white shadow-md sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 py-3 sm:py-3.5">
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Brand & Active List Selector */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-xl shadow-sm tracking-tight border-2 border-amber-300">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-white">
                  MERCADONA
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-400 text-emerald-950 px-1.5 py-0.5 rounded">
                  Lista & Carrito
                </span>

                {/* Backend Badge */}
                <button
                  type="button"
                  onClick={onRefreshBackend}
                  title={
                    isBackendConnected
                      ? 'Conectado al backend FastAPI (puerto 8000). Clic para refrescar.'
                      : 'Modo local (FastAPI no detectado en http://localhost:8000). Clic para reintentar.'
                  }
                  className={`hidden md:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                    isBackendConnected
                      ? 'bg-emerald-800 text-emerald-200 border-emerald-600 hover:bg-emerald-900'
                      : 'bg-amber-950/40 text-amber-200 border-amber-500/40 hover:bg-amber-900/50'
                  }`}
                >
                  <Server className="w-2.5 h-2.5" />
                  <span>{isBackendConnected ? 'FastAPI' : 'Modo Local'}</span>
                </button>
              </div>

              {/* Active list selector in header */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs text-emerald-200 hidden sm:inline">Lista activa:</span>
                <select
                  value={activeListId}
                  onChange={(e) => onSelectList(e.target.value)}
                  className="bg-emerald-800/90 text-white font-bold text-xs px-2 py-0.5 rounded border border-emerald-600/70 outline-none cursor-pointer hover:bg-emerald-800"
                >
                  {lists.map((l) => (
                    <option key={l.id} value={l.id} className="bg-slate-900 text-white">
                      {l.emoji} {l.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={onOpenListsTab}
                  className="text-[11px] text-emerald-200 hover:text-white underline decoration-emerald-400 cursor-pointer hidden sm:inline ml-1"
                >
                  gestionar
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenCatalog}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95"
              title="Abrir catálogo de productos frecuentes de Mercadona"
            >
              <PlusCircle className="w-4 h-4 text-emerald-900" />
              <span className="hidden sm:inline">Catálogo</span>
            </button>

            <button
              onClick={onOpenShare}
              className="p-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg transition-colors cursor-pointer"
              title="Compartir lista y carrito (WhatsApp)"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={onResetSample}
              className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
              title="Restaurar ejemplos de prueba"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
