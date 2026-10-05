import React, { useState } from 'react';
import { Plus, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import type { ShoppingList } from '../types';

interface ListsViewProps {
  lists: ShoppingList[];
  activeListId: string;
  onSelectList: (id: string) => void;
  onCreateList: (name: string, emoji?: string, color?: string) => void;
  onDeleteList: (id: string) => void;
  onGoToShopping: () => void;
}

const EMOJI_OPTIONS = ['🛒', '🥩', '🌮', '🥗', '🥖', '🧹', '🎂', '🏖️', '🍕', '🍻'];
const COLOR_OPTIONS = ['#059669', '#ea580c', '#0284c7', '#7c3aed', '#db2777', '#ca8a04'];

export const ListsView: React.FC<ListsViewProps> = ({
  lists,
  activeListId,
  onSelectList,
  onCreateList,
  onDeleteList,
  onGoToShopping,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🛒');
  const [selectedColor, setSelectedColor] = useState('#059669');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    onCreateList(newListName.trim(), selectedEmoji, selectedColor);
    setNewListName('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Add List Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>📋</span> Apartado de Listas de Compra
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organiza distintas compras (semanal, eventos, productos de limpieza Bosque Verde...)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nueva Lista</span>
        </button>
      </div>

      {/* Grid of Lists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {lists.map((list) => {
          const isActive = list.id === activeListId;

          return (
            <div
              key={list.id}
              className={`rounded-2xl p-5 border transition-all duration-200 relative flex flex-col justify-between ${
                isActive
                  ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs"
                      style={{ backgroundColor: `${list.color}15`, border: `1.5px solid ${list.color}40` }}
                    >
                      {list.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">
                          {list.name}
                        </h3>
                        {isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Activa
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {list.itemCount} {list.itemCount === 1 ? 'producto' : 'productos'} en total
                      </p>
                    </div>
                  </div>

                  {lists.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteList(list.id)}
                      className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar lista"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* List Summary Cards */}
                <div className="grid grid-cols-2 gap-2 my-4 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">En el carrito</span>
                    <strong className="text-emerald-700 font-bold text-sm">
                      {list.cartCount} <span className="text-slate-400 text-xs font-normal">artículos</span>
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Presupuesto total</span>
                    <strong className="text-slate-800 font-bold text-sm">
                      {list.totalEstimated.toFixed(2)} €
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                {isActive ? (
                  <button
                    type="button"
                    onClick={onGoToShopping}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Ver artículos de esta lista</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectList(list.id);
                      onGoToShopping();
                    }}
                    className="w-full bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 hover:border-emerald-300"
                  >
                    <span>Seleccionar y abrir lista</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to Create List */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
            <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                Nueva Lista de la Compra
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-emerald-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nombre de la lista
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Compra Quincenal, Cumpleaños, Barbacoa..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm outline-none focus:border-emerald-600 focus:bg-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Elige un icono
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all cursor-pointer ${
                        selectedEmoji === emoji
                          ? 'border-emerald-600 bg-emerald-50 scale-110 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Color distintivo
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                        selectedColor === color ? 'ring-3 ring-offset-2 ring-emerald-500 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newListName.trim()}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-xs"
                >
                  Guardar Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
