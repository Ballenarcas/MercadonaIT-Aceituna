import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, Sparkles } from 'lucide-react';
import { MERCADONA_CATEGORIES } from '../data/categories';
import { POPULAR_MERCADONA_CATALOG } from '../data/mercadonaCatalog';
import type { Brand, Unit, Priority, ShoppingItem } from '../types';

interface QuickAddBarProps {
  onAddItem: (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'completed'>) => void;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({ onAddItem }) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('fruta-verdura');
  const [brand, setBrand] = useState<Brand>('Hacendado');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<Unit>('ud');
  const [estimatedPrice, setEstimatedPrice] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<Priority>('media');
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<typeof POPULAR_MERCADONA_CATALOG>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Auto detect category & brand when typing
  useEffect(() => {
    if (!name.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const query = name.toLowerCase().trim();
    const matched = POPULAR_MERCADONA_CATALOG.filter((p) =>
      p.name.toLowerCase().includes(query)
    ).slice(0, 5);

    setSuggestions(matched);
    setShowSuggestions(matched.length > 0);

    // Auto assign brand based on text keywords if user hasn't toggled manually
    if (query.includes('bosque verde') || query.includes('detergente') || query.includes('friegasuelos')) {
      setBrand('Bosque Verde');
      setCategoryId('limpieza');
    } else if (query.includes('deliplus') || query.includes('gel') || query.includes('champu') || query.includes('crema')) {
      setBrand('Deliplus');
      setCategoryId('perfumeria');
    } else if (query.includes('compy') || query.includes('perro') || query.includes('gato')) {
      setBrand('Compy');
      setCategoryId('mascotas');
    }
  }, [name]);

  // Handle click outside suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (product: (typeof POPULAR_MERCADONA_CATALOG)[0]) => {
    setName(product.name);
    setCategoryId(product.categoryId);
    setBrand(product.brand);
    setUnit(product.defaultUnit);
    setEstimatedPrice(product.typicalPrice.toString());
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddItem({
      name: name.trim(),
      categoryId,
      brand,
      quantity: Number(quantity) || 1,
      unit,
      estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) : undefined,
      notes: notes.trim() || undefined,
      priority,
    });

    // Reset fields
    setName('');
    setEstimatedPrice('');
    setNotes('');
    setQuantity(1);
    setIsExpanded(false);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-4 mb-6 relative">
      <form onSubmit={handleSubmit}>
        {/* Main Input Row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => name.trim() && setSuggestions(POPULAR_MERCADONA_CATALOG.filter(p => p.name.toLowerCase().includes(name.toLowerCase())).slice(0, 5))}
              placeholder="¿Qué necesitas de Mercadona? (ej. Hummus, Leche, Salmón...)"
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 text-sm sm:text-base px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-slate-400"
            />

            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden py-1 max-h-60 overflow-y-auto">
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Sugerencias Mercadona
                </div>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 text-sm flex items-center justify-between transition-colors cursor-pointer border-b border-slate-50 last:border-none"
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs text-slate-400 font-normal">
                      {item.typicalPrice.toFixed(2)} € · {item.brand}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Añadir</span>
          </button>
        </div>

        {/* Quick Options Toggler / Details */}
        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            {/* Category Quick Select */}
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 outline-none cursor-pointer text-xs"
            >
              {MERCADONA_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>

            {/* Brand Quick Select */}
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value as Brand)}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 outline-none cursor-pointer text-xs"
            >
              <option value="Hacendado">Hacendado</option>
              <option value="Bosque Verde">Bosque Verde</option>
              <option value="Deliplus">Deliplus</option>
              <option value="Compy">Compy</option>
              <option value="General">Otra Marca</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer py-1 px-2 rounded hover:bg-emerald-50 transition-colors"
          >
            <span>{isExpanded ? 'Menos detalles' : 'Cantidad y precio'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Collapsible Detailed Inputs */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-fadeIn">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Cantidad</label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Unidad</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className="w-full bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ud">ud (unidad)</option>
                <option value="kg">kg (kilo)</option>
                <option value="g">g (gramos)</option>
                <option value="pack">pack</option>
                <option value="litro">litro</option>
                <option value="docena">docena</option>
                <option value="bandeja">bandeja</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Precio est. (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="ej. 1.85"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value)}
                className="w-full bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta (Imprescindible)</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Notas o detalles</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ej. Mirar fecha de caducidad, coger 2 si está en oferta..."
                className="w-full bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
