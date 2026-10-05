import React from 'react';
import logoMercadona from '../assets/Logo_Mercadona.png'; 

const Header: React.FC = () => {
  return (
    <header className="w-full flex flex-col font-sans">
      {/* Franja superior (Blanca) */}
      <div className="w-full bg-white text-gray-600 text-sm">
        <div className="flex justify-end items-center px-6 py-2 space-x-6 border-b border-gray-100">
          <a href="#" className="flex items-center hover:text-green-700">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Supermercados
          </a>
          <a href="#" className="flex items-center hover:text-green-700">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Empleo
          </a>
          <select className="bg-transparent focus:outline-none cursor-pointer">
            <option>Español</option>
            <option>English</option>
          </select>
        </div>

        {/* Zona del Logo real y Botón de Compra */}
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center space-x-3">
            {/* Logo de Mercadona en PNG importado desde assets */}
            <img 
              src={logoMercadona} 
              alt="Logo Mercadona" 
              className="h-12 w-auto object-contain"
            />
            <h1 className="text-4xl font-black text-[#00703c] tracking-tighter">MERCADONA</h1>
          </div>
          
          <button className="bg-[#e23000] text-white px-6 py-2.5 rounded-full font-semibold flex items-center hover:bg-orange-700 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Compra online
          </button>
        </div>
      </div>

      {/* Franja de Navegación Verde */}
      <nav className="w-full bg-[#00703c] text-white px-6 py-3">
        <ul className="flex space-x-8 text-sm font-medium">
          <li className="flex items-center cursor-pointer hover:text-green-200">Conócenos <span className="ml-1 text-xs">▼</span></li>
          <li className="flex items-center cursor-pointer hover:text-green-200">Consejos <span className="ml-1 text-xs">▼</span></li>
          <li className="cursor-pointer hover:text-green-200">Actualidad</li>
          <li className="cursor-pointer hover:text-green-200">Atención al Cliente</li>
          <li className="flex items-center cursor-pointer hover:text-green-200">Cuidemos el Planeta <span className="ml-1 text-xs">▼</span></li>
          <li className="cursor-pointer hover:text-green-200">Mercadona IT</li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;