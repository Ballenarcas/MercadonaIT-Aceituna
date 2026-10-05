"""
AI Chatbot endpoint powered by GroqCloud (Groq API, OpenAI-compatible).

The bot can:
 - Recommend recipes based on preferences / occasion
 - Show recipe ingredients
 - Add recipe ingredients to the active shopping list
 - Read and edit the shopping list JSON directly

Requires GROQ_API_KEY env-var to be set.
Optional: GROQ_MODEL (default: openai/gpt-oss-120b, gratis sin tarjeta).
"""

import json
import os
import sqlite3
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from groq import Groq

from ..database import get_db
from ..schemas import AddRecipeToListRequest, ChatRequest, ChatResponse
from .. import crud

router = APIRouter(prefix="/chat", tags=["AI Chat"])

# ── Groq setup ───────────────────────────────────────────────────────────────

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")


def _get_client() -> Groq:
    if not os.getenv("GROQ_API_KEY", ""):
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY no configurada. Añade la variable de entorno GROQ_API_KEY al servidor.",
        )
    return Groq()


SYSTEM_PROMPT = """\
Eres un asistente de cocina y compras para Mercadona. Tu nombre es 'mercadITo' 🫒.

Puedes ayudar al usuario a:
1. Descubrir y recomendar recetas según lo que le apetezca, la ocasión, el número de comensales, etc.
2. Mostrar los ingredientes de una receta.
3. Añadir los ingredientes de una receta directamente a su lista de la compra.
4. Ver y editar la lista de la compra (añadir o eliminar productos).

Siempre responde en ESPAÑOL. Sé amable, breve y útil.
Cuando recomiendes recetas menciona el emoji de la receta, el tiempo de preparación y el número de personas.
Cuando el usuario quiera añadir ingredientes a la lista, llama a la función add_recipe_to_list y confirma lo que has añadido.
"""

# ── Tool definitions (OpenAI / Groq function-calling format) ────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_recipes",
            "description": "Busca recetas en la base de datos por texto libre o categoría. Devuelve una lista de recetas con sus ingredientes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Texto de búsqueda (nombre, ingrediente, ocasión…)"},
                    "category": {"type": "string", "description": "Categoría (desayuno, comida, cena, postre, snack, general)"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_recipe_detail",
            "description": "Obtiene el detalle completo de una receta incluyendo todos sus ingredientes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "recipe_id": {"type": "string", "description": "ID de la receta"},
                },
                "required": ["recipe_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "add_recipe_to_list",
            "description": "Añade los ingredientes de una receta a la lista de la compra activa del usuario.",
            "parameters": {
                "type": "object",
                "properties": {
                    "recipe_id": {"type": "string", "description": "ID de la receta"},
                    "servings": {"type": "integer", "description": "Número de comensales para escalar cantidades (opcional)"},
                    "skip_optional": {"type": "boolean", "description": "Si true, omite los ingredientes opcionales"},
                },
                "required": ["recipe_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_list",
            "description": "Devuelve el contenido actual de la lista de la compra en formato JSON.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
]


# ── Helper to execute tool calls ────────────────────────────────────────────

def _execute_tool(name: str, args: Dict[str, Any], list_id: str, db: sqlite3.Connection) -> str:
    if name == "search_recipes":
        recipes = crud.get_recipes(db, search=args.get("query"), category=args.get("category"))
        if not recipes:
            return json.dumps({"recipes": [], "message": "No se encontraron recetas con esos criterios."})
        simplified = [
            {
                "id": r.id,
                "name": r.name,
                "imageEmoji": r.imageEmoji,
                "category": r.category,
                "servings": r.servings,
                "prepTimeMin": r.prepTimeMin,
                "description": r.description,
                "tags": r.tags,
                "ingredientCount": len(r.ingredients),
            }
            for r in recipes
        ]
        return json.dumps({"recipes": simplified})

    elif name == "get_recipe_detail":
        recipe = crud.get_recipe(db, args["recipe_id"])
        if not recipe:
            return json.dumps({"error": "Receta no encontrada"})
        return recipe.model_dump_json()

    elif name == "add_recipe_to_list":
        req = AddRecipeToListRequest(
            listId=list_id,
            servings=args.get("servings"),
            skipOptional=args.get("skip_optional", False),
        )
        added = crud.add_recipe_to_list(db, args["recipe_id"], req)
        names = [i.name for i in added]
        return json.dumps({"added": names, "count": len(names)})

    elif name == "get_list":
        return json.dumps(crud.get_list_as_json(db, list_id))

    return json.dumps({"error": f"Herramienta desconocida: {name}"})


# ── Chat endpoint ───────────────────────────────────────────────────────────

@router.post("", response_model=ChatResponse)
def chat(req: ChatRequest, db: sqlite3.Connection = Depends(get_db)):
    """Send a message to mercadITo and get a recipe/shopping recommendation."""
    client = _get_client()
    model = os.getenv("GROQ_MODEL", GROQ_MODEL)

    # Build OpenAI-style conversation
    messages: List[Dict[str, Any]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in req.history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": req.message})

    added_ingredients: List[str] = []
    suggested_recipes: List[str] = []

    # Agentic loop: Groq function-calling (OpenAI-compatible)
    MAX_TOOL_ROUNDS = 5
    reply_text = ""

    for _ in range(MAX_TOOL_ROUNDS):
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=messages,  # type: ignore
                tools=TOOLS,  # type: ignore
                tool_choice="auto",
                temperature=0.7,
                max_tokens=1024,
            )
        except Exception as exc:
            # Modelo retirado/sin acceso -> 502 con mensaje accionable
            if "model" in str(exc).lower() or "not found" in str(exc).lower():
                raise HTTPException(
                    status_code=502,
                    detail=f"El modelo '{model}' no existe o fue retirado por Groq. "
                    "Actualiza GROQ_MODEL en tu .env (p. ej. openai/gpt-oss-120b). "
                    "Modelos vigentes: https://console.groq.com/docs/models",
                )
            raise
        assistant_msg = completion.choices[0].message

        tool_calls = getattr(assistant_msg, "tool_calls", None) or []
        if not tool_calls:
            reply_text = assistant_msg.content or ""
            break

        # Append assistant tool-call message to history (required by Groq/OpenAI)
        messages.append(
            {
                "role": "assistant",
                "content": assistant_msg.content,
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in tool_calls
                ],
            }
        )

        # Execute each tool and feed results back
        for tc in tool_calls:
            try:
                tool_args = json.loads(tc.function.arguments or "{}")
            except json.JSONDecodeError:
                tool_args = {}
            tool_result = _execute_tool(tc.function.name, tool_args, req.listId, db)
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": tc.function.name,
                    "content": tool_result,
                }
            )
            # Track side effects for the frontend
            if tc.function.name == "add_recipe_to_list":
                try:
                    result_data = json.loads(tool_result)
                    added_ingredients.extend(result_data.get("added", []))
                except json.JSONDecodeError:
                    pass
            elif tc.function.name == "search_recipes":
                try:
                    result_data = json.loads(tool_result)
                    suggested_recipes.extend(r["name"] for r in result_data.get("recipes", []))
                except json.JSONDecodeError:
                    pass
    else:
        # Loop exhausted without a final text answer: ask model for summary
        completion = client.chat.completions.create(
            model=model,
            messages=messages,  # type: ignore
            temperature=0.7,
            max_tokens=1024,
        )
        reply_text = completion.choices[0].message.content or ""

    if not reply_text:
        reply_text = "Lo siento, no pude procesar tu solicitud. ¿Puedes intentarlo de nuevo?"

    return ChatResponse(
        reply=reply_text,
        addedIngredients=added_ingredients,
        suggestedRecipes=suggested_recipes,
    )
