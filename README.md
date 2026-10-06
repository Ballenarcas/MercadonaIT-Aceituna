# MercadonaIT Aceituna

Aplicacion full stack creada para una hackathon: una lista de la compra inteligente orientada a Mercadona. Permite organizar la compra por listas y pasillos, controlar el presupuesto estimado, consultar un catalogo de productos, convertir recetas en ingredientes y recibir sugerencias mediante un chatbot especializado en cocina.

El proyecto combina una interfaz React + TypeScript con una API FastAPI y una base de datos SQLite local. La aplicacion funciona sin servicios externos obligatorios, por lo que puede demostrarse rapidamente durante una hackathon y continuar evolucionando hacia una arquitectura con usuarios, sincronizacion y un proveedor de IA real.

## Que problema resuelve

Preparar una compra suele repartir la informacion entre notas, memoria y aplicaciones poco adaptadas al recorrido real de una tienda. MercadonaIT Aceituna concentra ese flujo en una sola experiencia:

- Crear varias listas, por ejemplo compra semanal, barbacoa o una lista compartida.
- Anadir productos manualmente o desde un catalogo de productos frecuentes.
- Clasificar cada producto por categoria o pasillo para recorrer la tienda con menos vueltas.
- Marcar productos como introducidos en el carrito y ver el progreso de la compra.
- Calcular el coste estimado total, pendiente y ya comprado.
- Buscar recetas, revisar sus ingredientes y anadirlos a una lista.
- Preguntar al chatbot por recetas compatibles con los ingredientes disponibles.
- Generar un texto de compra para compartir facilmente.

## Funcionalidades principales

### Listas y carrito

La vista principal permite cambiar entre listas, lista pendiente y carrito. Cada articulo conserva cantidad, unidad, marca, precio estimado, prioridad y notas. Las operaciones se guardan en la API y la interfaz aplica actualizaciones optimistas para que la interaccion sea inmediata incluso cuando la red tarda.

### Catalogo y organizacion por pasillos

El catalogo contiene productos de referencia y marcas habituales como Hacendado, Bosque Verde, Deliplus y Compy. Las categorias representan un orden practico de recorrido: fruta y verdura, horno, charcuteria, carniceria, pescaderia, lacteos, despensa, bebidas, limpieza y perfumeria, entre otras.

### Recetas y chatbot

Las recetas tienen ingredientes, cantidades, raciones, tiempo de preparacion, etiquetas y categoria. Se pueden crear, editar y eliminar. Al anadir una receta a una lista, el backend escala las cantidades segun las raciones y evita duplicar ingredientes cuando corresponde.

El chatbot funciona como una capa de asistencia sobre el dominio de compra: detecta ingredientes mencionados, busca recetas compatibles y calcula ingredientes que faltan. Las consultas fuera del contexto de cocina se redirigen para evitar respuestas que no tengan relacion con la aplicacion.

## Arquitectura

```text
MercadonaIT-Aceituna/
├── src/                         Frontend React + TypeScript + Vite
│   ├── components/              Vistas y componentes de la experiencia
│   ├── hooks/                   Estado y sincronizacion de listas
│   ├── services/api.ts          Cliente HTTP tipado para FastAPI
│   ├── types/                   Contratos TypeScript
│   └── App.tsx                  Composicion principal de la aplicacion
├── backend/
│   ├── app/main.py              Aplicacion FastAPI, CORS y ciclo de vida
│   ├── app/routers/             Endpoints por dominio
│   ├── app/crud.py              Operaciones de lectura, escritura y estadisticas
│   ├── app/database.py          Esquema SQLite, migraciones ligeras y datos demo
│   ├── app/schemas.py           Contratos Pydantic de entrada y salida
│   ├── app/fuzzy_service.py     Busqueda aproximada para recetas e ingredientes
│   ├── app/initial_data.py      Categorias y catalogo inicial
│   ├── run.py                   Arranque desde la raiz o desde backend
│   └── tests/                   Pruebas de API y logica de dominio
├── public/                      Recursos estaticos
└── package.json                 Scripts del frontend y backend
```

### Flujo de datos

1. React carga listas, articulos, categorias y recetas mediante `src/services/api.ts`.
2. FastAPI valida las peticiones con Pydantic y delega la persistencia en `crud.py`.
3. SQLite guarda los datos en `mercadona.db` en la raiz del repositorio por defecto.
4. Al arrancar la API se crea el esquema y se cargan datos de demostracion solo cuando hacen falta.
5. El frontend actualiza su estado y vuelve a consultar el backend despues de las operaciones que pueden afectar a varias entidades.

## Puesta en marcha

### Requisitos

- Node.js 18 o superior y npm.
- Python 3.10 o superior.
- Un entorno virtual de Python recomendado.

### Frontend

```powershell
npm install
npm run dev
```

La aplicacion queda disponible en `http://localhost:5173`.

### Backend

Desde la raiz del repositorio:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
python backend\run.py
```

La API queda disponible en `http://localhost:8000`. La documentacion interactiva esta en `/docs` y la documentacion ReDoc en `/redoc`.

Tambien se puede arrancar desde la carpeta `backend` con `python run.py`.

### Configuracion opcional

Se puede crear un archivo `.env` en la raiz para cambiar la ubicacion de SQLite:

```env
DATABASE_URL=sqlite:///./mercadona.db
```

El frontend usa `http://localhost:8000/api` por defecto. Para conectar otra instancia:

```env
VITE_API_URL=http://localhost:8000/api
```

## API disponible

| Dominio | Endpoints destacados | Uso |
| --- | --- | --- |
| Salud | `GET /` | Comprueba que la API esta activa |
| Listas | `/api/lists` | Crear, editar, archivar y consultar listas |
| Articulos | `/api/items` | CRUD, filtros, carrito y estadisticas |
| Categorias | `GET /api/categories` | Pasillos y orden de recorrido |
| Catalogo | `GET /api/catalog` | Busqueda de productos frecuentes |
| Recetas | `/api/recipes` | CRUD, busqueda y anadir ingredientes a una lista |
| Chat | `POST /api/chat` | Asistencia contextual sobre compra y cocina |

La especificacion completa se genera automaticamente en `http://localhost:8000/docs`.

## Pruebas y calidad

Instala las dependencias del backend antes de ejecutar sus pruebas:

```powershell
npm test
npm run build
npm run backend:test
```

Los dos primeros comandos validan los componentes React, los hooks y la compilacion de TypeScript. `npm run backend:test` ejecuta `pytest backend` y cubre salud, listas, articulos, recetas, catalogo, chatbot, CRUD y busqueda difusa.

Para ejecutar el backend directamente con el interprete activo, una alternativa equivalente es:

```powershell
python -m pytest backend
```

## Decisiones tecnicas

- **SQLite**: reduce la friccion de una demo y permite persistencia real sin levantar infraestructura adicional.
- **FastAPI + Pydantic**: ofrece validacion, tipado y documentacion OpenAPI automaticamente.
- **Separacion por routers**: cada dominio mantiene sus endpoints aislados y facilita sustituir SQLite por otro repositorio.
- **Datos demo idempotentes**: el arranque puede repetirse sin duplicar las entidades semilla.
- **Cliente HTTP centralizado**: los componentes no construyen URLs ni gestionan respuestas HTTP por separado.
- **Busqueda difusa**: tolera diferencias de escritura entre lo que introduce una persona y el nombre del catalogo.

## Limitaciones actuales y siguientes pasos

El alcance actual esta pensado para una demo funcional de hackathon. Todavia no incluye autenticacion, permisos por usuario, sincronizacion multi-dispositivo ni despliegue gestionado. La base para evolucionar el proyecto seria:

1. Incorporar usuarios y listas compartidas con autenticacion.
2. Sustituir la configuracion CORS abierta por una lista de origenes definida por entorno.
3. Extraer el repositorio SQLite detras de una interfaz para facilitar PostgreSQL en produccion.
4. Conectar el chatbot a un proveedor de IA mediante una capa de servicio con limites y observabilidad.
5. Anadir CI para ejecutar build, lint y pruebas en cada pull request.

## Equipo y contexto de hackathon

MercadonaIT Aceituna nace como un prototipo centrado en convertir una necesidad cotidiana en un flujo completo y demostrable: planificar, decidir, comprar y cocinar. La arquitectura prioriza velocidad de desarrollo, una experiencia clara y una base tecnica suficientemente separada para seguir creciendo despues de la hackathon.
