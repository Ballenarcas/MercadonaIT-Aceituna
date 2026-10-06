import os
import sys

import uvicorn

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

if __name__ == "__main__":
    print("🚀 Arrancando servidor FastAPI Mercadona en http://localhost:8000")
    print("📖 Documentación Swagger UI disponible en: http://localhost:8000/docs")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[BACKEND_DIR]
    )
