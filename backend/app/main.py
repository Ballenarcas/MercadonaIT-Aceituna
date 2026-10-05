from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import init_db, get_connection
from .crud import seed_sample_data, get_items
from .routers import items, categories, catalog, lists, recipes, chat

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables + seed data (solo aquí, no en cada import)
    init_db(seed=True)
    
    # Check if empty, then seed sample items
    conn = get_connection()
    try:
        existing = get_items(conn)
        if len(existing) == 0:
            seed_sample_data(conn)
    finally:
        conn.close()
        
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API en FastAPI para la lista de la compra de Mercadona con recetas y chatbot IA.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(lists.router, prefix=settings.API_V1_STR)
app.include_router(items.router, prefix=settings.API_V1_STR)
app.include_router(categories.router, prefix=settings.API_V1_STR)
app.include_router(catalog.router, prefix=settings.API_V1_STR)
app.include_router(recipes.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs"
    }
