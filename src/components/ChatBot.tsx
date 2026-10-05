import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, ShoppingCart, ChefHat, Loader2 } from 'lucide-react';
import type { ChatMessage, ShoppingList } from '../types';
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
  // Simple inline markdown: **bold**, *italic*, bullet points
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
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

export const ChatBot: React.FC<ChatBotProps> = ({ activeList, onIngredientAdded }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build history excluding welcome message (backend doesn't need it)
      const history = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));
      const res = await api.sendChatMessage(text, activeList.id, history);

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: res.reply,
        addedIngredients: res.addedIngredients,
        suggestedRecipes: res.suggestedRecipes,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (res.addedIngredients.length > 0) {
        onIngredientAdded();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ ${errorMessage}\n\nAsegúrate de que el backend está activo y que la variable **GEMINI_API_KEY** está configurada.`,
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
    '¿Qué puedo hacer para cenar?',
    'Recetas con pollo',
    '¿Qué tengo en la lista?',
    'Algo rápido para 2 personas',
  ];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-all ${
          open ? 'bg-slate-700 hover:bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
        title="AceitunAI - Asistente de cocina"
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
        <div className="fixed bottom-24 right-6 z-40 w-[360px] max-w-[calc(100vw-3rem)] h-[520px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-emerald-700 text-white px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-lg">🫒</div>
            <div className="flex-1">
              <p className="font-bold text-sm">AceitunAI</p>
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
                  className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  }`}
                >
                  <div className={`space-y-1 ${msg.role === 'user' ? 'text-white' : ''}`}>
                    {formatMarkdown(msg.content)}
                  </div>

                  {/* Side effects: added ingredients */}
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

                  {/* Side effects: suggested recipes */}
                  {msg.suggestedRecipes && msg.suggestedRecipes.length > 0 && (
                    <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-2">
                      <p className="text-[11px] font-bold text-amber-700 flex items-center gap-1 mb-1">
                        <ChefHat className="w-3 h-3" />
                        Recetas encontradas:
                      </p>
                      <ul className="space-y-0.5">
                        {msg.suggestedRecipes.map((name) => (
                          <li key={name} className="text-[11px] text-amber-700">• {name}</li>
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

          {/* Quick prompts (only shown when no user has sent a message) */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                  className="text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full hover:bg-emerald-100 cursor-pointer font-medium"
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
              placeholder="Escribe tu mensaje…"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
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
