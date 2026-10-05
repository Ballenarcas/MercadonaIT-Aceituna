"""
AI Chatbot endpoint powered by Google Gemini.

The bot can:
 - Recommend recipes based on preferences / occasion
 - Show recipe ingredients
 - Add recipe ingredients to the active shopping list
 - Read and edit the shopping list JSON directly

Requires GEMINI_API_KEY env-var to be set.
"""

import os
import json
import sqlite3
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
import google.generativeai as genai

from ..database import get_db
from ..schemas import ChatRequest, ChatResponse, AddRecipeToListRequest
from .. import crud

router = APIRouter(prefix="/chat", tags=["AI Chat"])

# ── Gemini setup ─────────────────────────────────────────────────────────────

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


def _get_model():
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY no configurada. Añade la variable de entorno GEMINI_API_KEY al servidor.",
        )
    genai.configure(api_key=GEMINI_API_KEY)
    return genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=SYSTEM_PROMPT,
    )


SYSTEM_PROMPT = """\
Eres un asistente de cocina y compras para Mercadona. Tu nombre es 'AceitunAI' 🫒.

Puedes ayudar al usuario a:
1. Descubrir y recomendar recetas según lo que le apetezca, la ocasión, el número de comensales, etc.
2. Mostrar los ingredientes de una receta.
3. Añadir los ingredientes de una receta directamente a su lista de la compra.
4. Ver y editar la lista de la compra (añadir o eliminar productos).

Siempre responde en ESPAÑOL. Sé amable, breve y útil.
Cuando recomiendes recetas menciona el emoji de la receta, el tiempo de preparación y el número de personas.
Cuando el usuario quiera añadir ingredientes a la lista, llama a la función add_recipe_to_list y confirma lo que has añadido.
"""

# ── Tool definitions for Gemini function calling ──────────────────────────────

TOOLS = [
    {
        "function_declarations": [
            {
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
            {
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
            {
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
            {
                "name": "get_list",
                "description": "Devuelve el contenido actual de la lista de la compra en formato JSON.",
                "parameters": {
                    "type": "object",
                    "properties": {},
                },
            },
        ]
    }
]


# ── Helper to execute tool calls ──────────────────────────────────────────────

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


# ── Chat endpoint ─────────────────────────────────────────────────────────────

@router.post("", response_model=ChatResponse)
def chat(req: ChatRequest, db: sqlite3.Connection = Depends(get_db)):
    """Send a message to AceitunAI and get a recipe/shopping recommendation."""
    model = _get_model()

    # Build conversation history for Gemini
    history = []
    for msg in req.history:
        history.append({
            "role": msg.role if msg.role == "user" else "model",
            "parts": [msg.content],
        })

    chat_session = model.start_chat(history=history)

    added_ingredients: List[str] = []
    suggested_recipes: List[str] = []

    # Send message (with tools)
    response = chat_session.send_message(
        req.message,
        tools=TOOLS,  # type: ignore
    )

    # Agentic loop: handle function calls
    MAX_TOOL_ROUNDS = 5
    for _ in range(MAX_TOOL_ROUNDS):
        candidate = response.candidates[0]
        # Check if there are function calls
        function_calls = [
            part.function_call
            for part in candidate.content.parts
            if hasattr(part, "function_call") and part.function_call.name
        ]
        if not function_calls:
            break

        # Execute each tool call and feed results back
        tool_responses = []
        for fc in function_calls:
            tool_result = _execute_tool(fc.name, dict(fc.args), req.listId, db)
            tool_responses.append({
                "function_response": {
                    "name": fc.name,
                    "response": {"result": tool_result},
                }
            })
            # Track side effects for the frontend
            if fc.name == "add_recipe_to_list":
                result_data = json.loads(tool_result)
                added_ingredients.extend(result_data.get("added", []))
            elif fc.name == "search_recipes":
                result_data = json.loads(tool_result)
                suggested_recipes.extend(r["name"] for r in result_data.get("recipes", []))

        response = chat_session.send_message(tool_responses)  # type: ignore

    # Extract final text reply
    reply_text = ""
    for part in response.candidates[0].content.parts:
        if hasattr(part, "text") and part.text:
            reply_text += part.text

    if not reply_text:
        reply_text = "Lo siento, no pude procesar tu solicitud. ¿Puedes intentarlo de nuevo?"

    return ChatResponse(
        reply=reply_text,
        addedIngredients=added_ingredients,
        suggestedRecipes=suggested_recipes,
    )
