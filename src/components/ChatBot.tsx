import React, { useEffect, useRef, useState } from 'react';
import { Check, Loader2, MessageSquareText, Plus, Send, ShoppingCart } from 'lucide-react';
import mercaditoImage from '../assets/Mercadito.png';
import { api } from '../services/api';
import type { ChatMessage, MissingIngredient, ShoppingList } from '../types';

interface ChatBotProps {
  activeList?: ShoppingList;
  lists?: ShoppingList[];
  onIngredientAdded?: () => void;
  onItemsAdded?: (items: import('../types').ShoppingItem[]) => void;
}

const DEFAULT_LIST: ShoppingList = {
  id: 'default',
  name: 'Compra Principal',
  emoji: '🛒',
  color: '#059669',
  itemCount: 0,
  cartCount: 0,
  totalEstimated: 0,
  cartEstimated: 0,
  createdAt: Date.now(),
};

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    '¡Hola! Soy **mercadITo** 🛒, tu asistente de cocina y compras.\n\nPuedo ayudarte a:\n• 🍽️ **Recomendar recetas** según lo que te apetezca\n• 🛒 **Añadir ingredientes** a tu lista de la compra\n• 📋 **Ver tu lista** actual y sugerirte complementos\n\n¿Qué te apetece cocinar hoy?',
};

function inlineMd(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_([^_\n]+)_/g, '<em>$1</em>');
}

function formatMarkdown(text: string, isUserMessage = false) {
  const lines = text.split('\n');
  const textColor = isUserMessage ? 'text-white' : 'text-slate-700';

  return lines.map((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
      return (
        <li key={i} className={`ml-4 text-sm leading-relaxed ${textColor}`}>
          <span dangerouslySetInnerHTML={{ __html: inlineMd(trimmed.slice(2)) }} />
        </li>
      );
    }

    if (!trimmed) {
      return <div key={i} className="h-2" />;
    }

    return (
      <p key={i} className={`text-sm leading-relaxed ${textColor}`}>
        <span dangerouslySetInnerHTML={{ __html: inlineMd(trimmed) }} />
      </p>
    );
  });
}

interface MissingIngredientsProps {
  recipeName?: string;
  ingredients: MissingIngredient[];
  activeListId: string;
  lists: ShoppingList[];
  onAdded: () => void;
  onItemsAdded?: (items: import('../types').ShoppingItem[]) => void;
}

const MissingIngredientsChecklist: React.FC<MissingIngredientsProps> = ({
  recipeName,
  ingredients,
  activeListId,
  lists,
  onAdded,
  onItemsAdded,
}) => {
  const [checkedIndices, setCheckedIndices] = useState<Set<number>>(() => new Set(ingredients.map((_, idx) => idx)));
  const [selectedListId, setSelectedListId] = useState(activeListId);
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
      const targetListId = inCart ? activeListId : selectedListId;
      const itemsToCreate = selected.map((item) => ({
        name: item.name,
        listId: targetListId,
        categoryId: item.categoryId || 'otros',
        brand: (item.brand as any) || 'Hacendado',
        quantity: item.quantity || 1,
        unit: (item.unit as any) || 'ud',
        estimatedPrice: item.estimatedPrice,
        inCart,
        completed: false,
        notes: item.notes || (recipeName ? `De receta: ${recipeName}` : 'De receta'),
        priority: 'media' as const,
      }));

      const createdItems = await api.createItemsBatch(targetListId, itemsToCreate);

      onItemsAdded?.(createdItems);

      if (inCart) {
        setAddedToCartSuccess(true);
      } else {
        setAddedToListSuccess(true);
      }

      onAdded();
    } catch (error) {
      console.error(`Error adding missing ingredients to ${inCart ? 'cart' : 'list'}:`, error);
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
    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-emerald-800">
        <ShoppingCart className="h-3.5 w-3.5 text-emerald-700" />
        <span>
          Ingredientes faltantes {recipeName ? `(${recipeName})` : ''}:
        </span>
      </div>

      <div className="mb-3 max-h-48 space-y-1.5 overflow-y-auto pr-1">
        {ingredients.map((ing, idx) => {
          const isChecked = checkedIndices.has(idx);

          return (
            <label
              key={`${ing.name}-${idx}`}
              className={`flex cursor-pointer items-start gap-2 rounded-lg p-1.5 text-xs transition-colors ${
                isChecked ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-white/60'
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleIndex(idx)}
                className="mt-0.5 rounded text-emerald-600 accent-emerald-600"
              />
              <div className="min-w-0 flex-1">
                <span className={`font-medium ${isChecked ? 'text-slate-800' : 'text-slate-500 line-through'}`}>
                  {ing.name}
                </span>
                <span className="ml-1 text-[11px] text-slate-500">
                  ({ing.quantity} {ing.unit})
                </span>
              </div>
              {ing.estimatedPrice !== undefined && ing.estimatedPrice !== null && (
                <span className="whitespace-nowrap text-[11px] font-semibold text-emerald-700">
                  {((ing.quantity || 0) * ing.estimatedPrice).toFixed(2)} €
                </span>
              )}
            </label>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-emerald-200/80 pt-2">
        <span className="text-[11px] font-medium text-emerald-700">{checkedIndices.size} seleccionados</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {lists.length > 1 && (
            <label className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
              Lista:
              <select
                value={selectedListId}
                onChange={(event) => setSelectedListId(event.target.value)}
                disabled={anyLoading || addedToListSuccess}
                className="max-w-[135px] rounded-md border border-emerald-300 bg-white px-1.5 py-1 text-[11px] font-semibold text-gray-700 outline-none focus:border-emerald-600"
                aria-label="Seleccionar lista de destino"
              >
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            onClick={() => handleAddItems(false)}
            disabled={checkedIndices.size === 0 || anyLoading || addedToListSuccess}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
              addedToListSuccess
                ? 'cursor-default bg-green-600 text-white'
                : 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40'
            }`}
            title="Añadir a la lista de la compra"
          >
            {addingToList ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Añadiendo…</span>
              </>
            ) : addedToListSuccess ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>¡En lista!</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                <span>Añadir a la lista</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleAddItems(true)}
            disabled={checkedIndices.size === 0 || anyLoading || addedToCartSuccess}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
              addedToCartSuccess
                ? 'cursor-default bg-amber-600 text-white'
                : 'bg-amber-500 text-white shadow-sm hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40'
            }`}
            title="Añadir directamente al carrito de la compra"
          >
            {addingToCart ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Añadiendo…</span>
              </>
            ) : addedToCartSuccess ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>¡En carrito!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Añadir al carrito</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ChatBot: React.FC<ChatBotProps> = ({
  activeList = DEFAULT_LIST,
  lists = [activeList],
  onIngredientAdded = () => undefined,
  onItemsAdded,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await api.sendChatMessage(trimmed, activeList.id, messages);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.reply || 'He recibido tu mensaje. Pronto te ayudaré con tus listas o recetas.',
        addedIngredients: response.addedIngredients,
        suggestedRecipes: response.suggestedRecipes,
        recipeSuggestions: response.recipeSuggestions,
        missingIngredients: response.missingIngredients,
        recipeName: response.recipeName,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending chat message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'No he podido contactar con el asistente. Inténtalo de nuevo en un momento.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[500px] max-h-[80vh] w-80 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl sm:w-96">
          <div className="flex items-center justify-between bg-[#00703c] px-4 py-4 text-white shadow-md">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center rounded-full bg-white p-1.5">
                <MessageSquareText className="h-5 w-5 text-[#00703c]" />
              </div>
              <span className="text-lg font-semibold">mercadITo</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 transition-colors hover:bg-green-700"
              aria-label="Cerrar chat"
            >
              <Plus className="h-5 w-5 rotate-45" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
            <div className="flex flex-col gap-4">
              {messages.map((msg, idx) => (
                <div
                  key={`${msg.role}-${idx}`}
                  className={`max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}
                >
                  <div
                    className={`rounded-2xl p-3 text-sm shadow-sm ${
                      msg.role === 'user'
                        ? 'rounded-br-none bg-[#00703c] text-white'
                        : 'rounded-bl-none border border-gray-100 bg-white text-gray-800'
                    }`}
                  >
                    {msg.content && formatMarkdown(msg.content, msg.role === 'user')}

                    {msg.missingIngredients && msg.missingIngredients.length > 0 && (
                      <MissingIngredientsChecklist
                        recipeName={msg.recipeName}
                        ingredients={msg.missingIngredients}
                        activeListId={activeList.id}
                        lists={lists}
                        onAdded={onIngredientAdded}
                        onItemsAdded={onItemsAdded}
                      />
                    )}

                    {msg.recipeSuggestions && msg.recipeSuggestions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.recipeSuggestions.map((recipe) => (
                          <div
                            key={recipe.id}
                            className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-left"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-amber-800">{recipe.name}</span>
                              <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                                {recipe.matchScore}%
                              </span>
                            </div>
                            {recipe.matchedIngredients.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {recipe.matchedIngredients.map((ingredient, ingredientIndex) => (
                                  <span
                                    key={`${recipe.id}-${ingredient}-${ingredientIndex}`}
                                    className="rounded-full bg-white px-1.5 py-0.5 text-[10px] text-slate-600"
                                  >
                                    {ingredient}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-gray-100 bg-white p-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Escribe ingredientes o una receta"
              className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#00703c] focus:bg-white"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className="rounded-full bg-[#00703c] p-2.5 text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-[#00703c] bg-white shadow-2xl transition-transform hover:scale-105"
          title="mercadITo - Asistente de cocina"
        >
          <img src={mercaditoImage} alt="Mercadito" className="h-full w-full object-cover" />
        </button>
      )}
    </>
  );
};

export default ChatBot;