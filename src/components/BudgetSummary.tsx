import React from 'react';
import { ShoppingCart, CheckCircle2, Sparkles } from 'lucide-react';

interface BudgetSummaryProps {
  stats: {
    totalItems: number;
    completedItems: number;
    pendingItems: number;
    totalEstimated: number;
    pendingEstimated: number;
    completedEstimated: number;
    progressPercentage: number;
  };
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({ stats }) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 mb-5 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Estado de la Compra
            </span>
            <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>{stats.completedItems} de {stats.totalItems} productos listos</span>
              {stats.progressPercentage === 100 && stats.totalItems > 0 && (
                <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  <Sparkles className="w-3 h-3" /> ¡Completada!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Estimated Total Price */}
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Presupuesto Estimado
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 leading-tight">
            {stats.totalEstimated.toFixed(2)} <span className="text-sm font-semibold">€</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-3">
        <div
          className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${stats.progressPercentage}%` }}
        />
      </div>

      {/* Mini Stats Breakdown */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Pendientes: <strong className="text-slate-800">{stats.pendingItems}</strong> ({stats.pendingEstimated.toFixed(2)}€)</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>En el carro: <strong className="text-slate-800">{stats.completedItems}</strong> ({stats.completedEstimated.toFixed(2)}€)</span>
        </div>
        <div className="flex items-center gap-1.5 justify-end">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Progreso: <strong className="text-emerald-700">{stats.progressPercentage}%</strong></span>
        </div>
      </div>
    </div>
  );
};
