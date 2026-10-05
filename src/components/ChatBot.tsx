import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, ShoppingCart, ChefHat, Loader2, Check, Plus } from 'lucide-react';
import type { ChatMessage, ShoppingList, MissingIngredient } from '../types';
import { api } from '../services/api';

interface ChatBotProps {
  activeList: ShoppingList;
  onIngredientAdded: () => void;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    '¡Hola! Soy **AceitunAI** 🫒, tu asistente de cocina y compras.\n\nPuedo ayudarte a:\n• 🍽️ **Recomendar recetas** según lo que te apetezca\n• 🛒 **Añadir ingredientes** a tu lista de la compra\n• 📋 **Ver tu lista** actual y sugerirte complementos\n\n¿Qué te apetece cocinar hoy?',
};

function formatMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
      const content = trimmed.slice(2);
      return (
        <li key={i} className="ml-3 text-sm">
          <span dangerouslySetInnerHTML={{ __html: inlineMd(content) }} />
        </li>
      );
    }
    return (
      <p key={i} className="text-sm leading-relaxed">
        <span dangerouslySetInnerHTML={{ __html: inlineMd(line) }} />
      </p>
    );
  });
}

function inlineMd(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_([^_\n]+)_/g, '<em>$1</em>');
}

// ── Interactive Checklist of Missing Ingredients ─────────────────────────────

interface MissingIngredientsProps {
  recipeName?: string;
  ingredients: MissingIngredient[];
  activeListId: string;
  onAdded: () => void;
}

const MissingIngredientsChecklist: React.FC<MissingIngredientsProps> = ({
  recipeName,
  ingredients,
  activeListId,
  onAdded,
}) => {
  const [checkedIndices, setCheckedIndices] = useState<Set<number>>(
    () => new Set(ingredients.map((_, idx) => idx))
  );
  const [addingToList, setAddingToList] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToListSuccess, setAddedToListSuccess] = useState(false);
  const [addedToCartSuccess, setAddedToCartSuccess] = useState(false);

  const toggleIndex = (idx: number) => {
    setCheckedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleAddItems = async (inCart: boolean) => {
    const selected = ingredients.filter((_, idx) => checkedIndices.has(idx));
    if (selected.length === 0 || addingToList || addingToCart) return;

    if (inCart) {
      setAddingToCart(true);
    } else {
      setAddingToList(true);
    }

    try {
      const itemsToCreate = selected.map((item) => ({
        name: item.name,
        listId: activeListId,
        categoryId: item.categoryId || 'otros',
        brand: (item.brand as any) || 'Hacendado',
        quantity: item.quantity || 1.0,
        unit: (item.unit as any) || 'ud',
        estimatedPrice: item.estimatedPrice,
        inCart: inCart,
        completed: false,
        notes: item.notes || (recipeName ? `De receta: ${recipeName}` : 'De receta'),
        priority: 'media' as const,
      }));

      await api.createItemsBatch(activeListId, itemsToCreate);
      if (inCart) {
        setAddedToCartSuccess(true);
      } else {
        setAddedToListSuccess(true);
      }
      onAdded();
    } catch (e) {
      console.error(`Error adding missing ingredients to ${inCart ? 'cart' : 'list'}:`, e);
    } finally {
      if (inCart) {
        setAddingToCart(false);
      } else {
        setAddingToList(false);
      }
    }
  };

  const anyLoading = addingToList || addingToCart;

  return (
    <div className="mt-2.5 bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 shadow-xs">
      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-2">
        <ShoppingCart className="w-3.5 h-3.5 text-emerald-700" />
        <span>Ingredientes faltantes {recipeName ? `(${recipeName})` : ''}:</span>
      </div>

      <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto pr-1">
        {ingredients.map((ing, idx) => {
          const isChecked = checkedIndices.has(idx);
          return (
            <label
              key={idx}
              className={`flex items-start gap-2 p-1.5 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                isChecked ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:bg-white/60'
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleIndex(idx)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
              />
              <div className="flex-1 min-w-0">
                <span className={`font-medium ${isChecked ? 'text-slate-800' : 'text-slate-500 line-through'}`}>
                  {ing.name}
                </span>
                <span className="text-[11px] text-slate-500 ml-1">
                  ({ing.quantity} {ing.unit})
                </span>
              </div>
              {ing.estimatedPrice !== undefined && ing.estimatedPrice !== null && (
                <span className="text-[11px] font-semibold text-emerald-700 whitespace-nowrap">
                  {ing.estimatedPrice.toFixed(2)} €
                </span>
              )}
            </label>
          );
        })}
      </div>

      <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-emerald-700 font-medium">
          {checkedIndices.size} seleccionados
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleAddItems(false)}
            disabled={checkedIndices.size === 0 || anyLoading || addedToListSuccess}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              addedToListSuccess
                ? 'bg-green-600 text-white cursor-default'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
            title="Añadir a la lista de la compra"
          >
            {addingToList ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Añadiendo…</span>
              </>
            ) : addedToListSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>¡En lista!</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir a la lista</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleAddItems(true)}
            disabled={checkedIndices.size === 0 || anyLoading || addedToCartSuccess}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              addedToCartSuccess
                ? 'bg-amber-600 text-white cursor-default'
                : 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-xs disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
            title="Añadir directamente al carrito de la compra"
          >
            {addingToCart ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Añadiendo…</span>
              </>
            ) : addedToCartSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>¡En carrito!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Añadir al carrito</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ChatBot Component ───────────────────────────────────────────────────

export const ChatBot: React.FC<ChatBotProps> = ({ activeList, onIngredientAdded }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    if (!overrideText) setInput('');
    setLoading(true);

    try {
      // Build history excluding welcome message
      const history = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));
      const res = await api.sendChatMessage(text, activeList.id, history);

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: res.reply,
        addedIngredients: res.addedIngredients,
        suggestedRecipes: res.suggestedRecipes,
        recipeSuggestions: res.recipeSuggestions,
        missingIngredients: res.missingIngredients,
        recipeName: res.recipeName,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (res.addedIngredients && res.addedIngredients.length > 0) {
        onIngredientAdded();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ ${errorMessage}\n\nAsegúrate de que el backend está activo.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const QUICK_PROMPTS = [
    'Tengo arroz, tomate y huevos',
    'Macarrones a la boloñesa',
    'Tengo pollo, aceite y sal',
    '¿Qué tengo en la lista?',
  ];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-all ${
          open ? 'bg-slate-700 hover:bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
        title="mercadITo - Asistente de cocina"
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <Bot className="w-7 h-7 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white" />
          </div>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[380px] max-w-[calc(100vw-3rem)] h-[560px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-emerald-700 text-white px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-lg">🫒</div>
            <div className="flex-1">
              <p className="font-bold text-sm">mercadITo</p>
              <p className="text-[11px] text-emerald-200">
                Lista activa: {activeList.emoji} {activeList.name}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[90%] rounded-2xl px-3 py-2 ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  }`}
                >
                  <div className={`space-y-1 ${msg.role === 'user' ? 'text-white' : ''}`}>
                    {formatMarkdown(msg.content)}
                  </div>

                  {/* Interactive missing ingredients checklist */}
                  {msg.missingIngredients && msg.missingIngredients.length > 0 && (
                    <MissingIngredientsChecklist
                      recipeName={msg.recipeName}
                      ingredients={msg.missingIngredients}
                      activeListId={activeList.id}
                      onAdded={onIngredientAdded}
                    />
                  )}

                  {/* Suggested recipes chips */}
                  {((msg.recipeSuggestions && msg.recipeSuggestions.length > 0) ||
                    (msg.suggestedRecipes && msg.suggestedRecipes.length > 0 && (!msg.missingIngredients || msg.missingIngredients.length === 0))) && (
                    <div className="mt-2.5 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                      <p className="text-[11px] font-bold text-amber-800 flex items-center gap-1 mb-2">
                        <ChefHat className="w-3.5 h-3.5 text-amber-700" />
                        Recetas posibles encontradas (haz clic para ver ingredientes):
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {msg.recipeSuggestions && msg.recipeSuggestions.length > 0
                          ? msg.recipeSuggestions.map((rec) => (
                              <button
                                key={rec.id || rec.name}
                                onClick={() => sendMessage(rec.name)}
                                className="flex items-center justify-between p-2 rounded-lg bg-white border border-amber-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all cursor-pointer group"
                              >
                                <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700 flex items-center gap-1.5">
                                  <span>{rec.imageEmoji || '🍽️'}</span>
                                  <span>{rec.name}</span>
                                </span>
                                {rec.matchScore > 0 && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">
                                    {rec.matchScore}%
                                  </span>
                                )}
                              </button>
                            ))
                          : msg.suggestedRecipes?.map((name) => (
                              <button
                                key={name}
                                onClick={() => sendMessage(name)}
                                className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-amber-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left text-xs font-semibold text-slate-800 group-hover:text-emerald-700 transition-all cursor-pointer"
                              >
                                <span>🍽️</span>
                                <span>{name}</span>
                              </button>
                            ))}
                      </div>
                    </div>
                  )}

                  {/* Side effects: added ingredients summary */}
                  {msg.addedIngredients && msg.addedIngredients.length > 0 && (
                    <div className="mt-2 bg-green-50 border border-green-200 rounded-xl p-2">
                      <p className="text-[11px] font-bold text-green-700 flex items-center gap-1 mb-1">
                        <ShoppingCart className="w-3 h-3" />
                        Añadido a tu lista:
                      </p>
                      <ul className="space-y-0.5">
                        {msg.addedIngredients.map((name) => (
                          <li key={name} className="text-[11px] text-green-700">✓ {name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-3 py-2.5 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                  <span className="text-xs text-slate-500">AceitunAI está pensando…</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                  className="text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full hover:bg-emerald-100 cursor-pointer font-medium transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-slate-200 p-2 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escribe ingredientes o una receta…"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
