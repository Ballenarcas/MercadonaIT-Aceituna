import React from 'react';
import { Share2, PlusCircle, RotateCcw, Trash2, Server } from 'lucide-react';

interface HeaderProps {
  onOpenCatalog: () => void;
  onOpenShare: () => void;
  onResetSample: () => void;
  onClearCompleted: () => void;
  completedCount: number;
  isBackendConnected: boolean | null;
  onRefreshBackend: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCatalog,
  onOpenShare,
  onResetSample,
  onClearCompleted,
  completedCount,
  isBackendConnected,
  onRefreshBackend,
}) => {
  return (
    <header className="bg-emerald-700 text-white shadow-md sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Brand */}
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
                  Lista
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
                  className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                    isBackendConnected
                      ? 'bg-emerald-800 text-emerald-200 border-emerald-600 hover:bg-emerald-900'
                      : 'bg-amber-950/40 text-amber-200 border-amber-500/40 hover:bg-amber-900/50'
                  }`}
                >
                  <Server className="w-2.5 h-2.5" />
                  <span>{isBackendConnected ? 'FastAPI Conectado' : 'FastAPI Offline (Local)'}</span>
                </button>
              </div>
              <p className="text-xs text-emerald-100 font-medium hidden sm:block">
                Tu compra organizada por pasillos de tienda
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenCatalog}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm shadow transition-all cursor-pointer active:scale-95"
              title="Abrir catálogo de productos frecuentes de Mercadona"
            >
              <PlusCircle className="w-4 h-4 text-emerald-900" />
              <span className="hidden sm:inline">Catálogo</span>
            </button>

            <button
              onClick={onOpenShare}
              className="p-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg transition-colors cursor-pointer"
              title="Compartir lista (WhatsApp / Texto)"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {completedCount > 0 && (
              <button
                onClick={onClearCompleted}
                className="p-2 bg-emerald-800/80 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
                title={`Borrar ${completedCount} artículos comprados`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

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
