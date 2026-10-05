# 🛒 Mercadona - Lista de la Compra (React + FastAPI)

Aplicación Fullstack compuesta exclusivamente por **React (TypeScript)** en el frontend y **FastAPI (Python)** en el backend, con persistencia en **SQLite** y soporte completo para la organización por pasillos y marcas propias de Mercadona (**Hacendado**, **Bosque Verde**, **Deliplus**, **Compy**).

---

## 🏗️ Arquitectura del Proyecto

```text
MercadonaIT-Aceituna/
├── backend/                       # 🐍 BACKEND (FastAPI + Python + SQLite)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py              # Configuración y orígenes CORS
│   │   ├── database.py            # Conexión e inicialización SQLite
│   │   ├── schemas.py             # Modelos Pydantic (validación y serialización)
│   │   ├── crud.py                # Operaciones CRUD y cálculo de métricas
│   │   ├── initial_data.py        # Categorías de pasillos y catálogo Mercadona
│   │   ├── main.py                # Instancia FastAPI y middleware CORS
│   │   └── routers/
│   │       ├── items.py           # /api/items (CRUD de productos, toggle, stats)
│   │       ├── categories.py      # /api/categories (Pasillos de tienda)
│   │       └── catalog.py         # /api/catalog (Buscador de productos frecuentes)
│   ├── requirements.txt           # Dependencias de Python
│   ├── run.py                     # Script para iniciar el servidor FastAPI
│   └── test_api.py                # Suite de pruebas automatizadas del API
│
├── src/                           # ⚛️ FRONTEND (React + TypeScript + Vite)
│   ├── components/
│   │   ├── BudgetSummary.tsx      # Presupuesto estimado y progreso en directo
│   │   ├── CatalogModal.tsx       # Catálogo modal de productos frecuentes
│   │   ├── EmptyState.tsx         # Estado vacío interactivo
│   │   ├── FilterBar.tsx          # Búsqueda, secciones y ordenación
│   │   ├── Header.tsx             # Cabecera con estado de conexión a FastAPI
│   │   ├── ItemCard.tsx           # Fila de producto (stepper, checkbox, notas)
│   │   ├── QuickAddBar.tsx        # Inserción rápida con autocompletado
│   │   └── ShareModal.tsx         # Compartir por WhatsApp o copiar texto
│   ├── data/
│   │   ├── categories.ts          # Mapeo de categorías y pasillos
│   │   └── mercadonaCatalog.ts    # Datos de referencia
│   ├── hooks/
│   │   └── useShoppingList.ts     # Hook reactivo sincronizado con FastAPI
│   ├── services/
│   │   └── api.ts                 # Cliente HTTP para conectar con FastAPI
│   ├── types/
│   │   └── index.ts               # Tipos TypeScript
│   ├── App.tsx                    # Vista principal
│   └── main.tsx                   # Punto de entrada React
│
├── package.json
└── README.md
```

---

## 🚀 Cómo Ejecutar la Aplicación

### 1️⃣ Iniciar el Backend (FastAPI)

En una terminal:

```powershell
python backend/run.py
```

- 🌐 Servidor API: `http://localhost:8000`
- 📖 Documentación Swagger UI interactiva: `http://localhost:8000/docs`
- 📖 Documentación ReDoc: `http://localhost:8000/redoc`

Para ejecutar las pruebas del backend:
```powershell
npm run backend:test
# o directamente:
python backend/test_api.py
```

---

### 2️⃣ Iniciar el Frontend (React + TypeScript)

En otra terminal:

```powershell
npm run dev
```

- 🖥️ Aplicación web: `http://localhost:5173`

---

## 🌟 Endpoints Principales del Backend (FastAPI)

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/items` | Obtiene la lista de compra con filtros (sección, estado, búsqueda, orden) |
| `POST` | `/api/items` | Añade un nuevo producto a la lista |
| `PUT` | `/api/items/{id}` | Actualiza cantidad, precio, notas o prioridad |
| `PATCH` | `/api/items/{id}/toggle` | Marca un producto como comprado / pendiente |
| `DELETE` | `/api/items/{id}` | Elimina un producto específico |
| `DELETE` | `/api/items/completed` | Limpia todos los artículos comprados |
| `POST` | `/api/items/reset-sample` | Restaura los productos de ejemplo iniciales |
| `GET` | `/api/items/stats` | Devuelve el desglose de presupuesto y porcentaje |
| `GET` | `/api/items/share-text` | Genera el texto formateado para WhatsApp |
| `GET` | `/api/categories` | Lista de categorías y orden físico de pasillos |
| `GET` | `/api/catalog` | Catálogo de productos populares de Mercadona |
