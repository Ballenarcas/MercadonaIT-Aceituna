import React, { useState } from 'react';
import mercaditoImage from '../assets/Mercadito.png';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{text: string, isUser: boolean}[]>([
    { text: '¡Hola! Soy Mercadito, tu asistente virtual. ¿En qué te puedo ayudar hoy?', isUser: false }
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    // Añadimos el mensaje del usuario
    setMessages(prev => [...prev, { text: input, isUser: true }]);
    setInput('');
    
    // Respuesta simulada
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: 'He recibido tu mensaje. Pronto te ayudaré con tus listas o recetas.', 
        isUser: false 
      }]);
    }, 1000);
  };

  return (
    <>
      {/* 1. Ventana del Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden flex flex-col h-[500px] max-h-[80vh] transition-all duration-300 transform origin-bottom-right">
          
          {/* Cabecera del Chat */}
          <div className="bg-[#00703c] px-4 py-4 flex justify-between items-center text-white shadow-md z-10">
            <div className="flex items-center space-x-2">
              <div className="bg-white rounded-full p-1.5 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#00703c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="font-semibold text-lg">Mercadito</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="hover:bg-green-700 p-1.5 rounded-full transition-colors cursor-pointer"
              aria-label="Cerrar chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`max-w-[85%] p-3 text-sm rounded-2xl shadow-sm ${
                  msg.isUser 
                    ? 'bg-[#00703c] text-white self-end rounded-br-none' 
                    : 'bg-white border border-gray-100 text-gray-800 self-start rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input de Mensaje */}
          <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-2">
            <input 
              type="text" 
              className="flex-1 border border-gray-200 bg-gray-50 rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#00703c] focus:bg-white transition-colors" 
              placeholder="Escribe un mensaje..." 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
            />
            <button 
              onClick={handleSend} 
              disabled={!input.trim()}
              className="bg-[#00703c] text-white p-2.5 rounded-full hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
               </svg>
            </button>
          </div>
        </div>
      )}

      {/* 2. Botón Flotante con la imagen Mercadito.png */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-white hover:scale-105 transition-transform rounded-full shadow-2xl z-50 flex items-center justify-center overflow-hidden border-2 border-[#00703c] cursor-pointer"
          title="Abrir Mercadito"
        >
          <img 
            src={mercaditoImage} 
            alt="Mercadito" 
            className="w-full h-full object-cover" 
          />
        </button>
      )}
    </>
  );
}

export default ChatBot;