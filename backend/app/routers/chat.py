"""
AI Chatbot endpoint powered by GroqCloud and fuzzy matching with thefuzz.

The bot can:
 - Recommend recipes based on preferences / occasion
 - Show recipe ingredients
 - Add recipe ingredients to the active shopping list
 - Read and edit the shopping list JSON directly

Requires GROQ_API_KEY env-var to be set.
 - Recommend recipes based on ingredients using fuzzy matching (thefuzz)
 - Return missing recipe ingredients from the database with checkboxes for adding to cart
 - Match recipe names directly and return ingredients
 - Answer cooking and shopping questions via Groq LLM
GROQ_API_KEY is optional; without it the endpoint uses deterministic database responses.
Optional: GROQ_MODEL (default: llama-3.3-70b-versatile).
"""

import json
import os
import sqlite3
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends
from dotenv import load_dotenv

from ..database import get_db
from ..schemas import (
    AddRecipeToListRequest,
    ChatRequest,
    ChatResponse,
    RecipeSuggestionItem,
    MissingIngredientItem,
)
from ..fuzzy_service import (
    search_recipes_by_ingredients,
    search_recipe_by_name,
    extract_ingredients,
    is_giving_ingredients,
    get_recipes_from_db,
)
from .. import crud

load_dotenv()

router = APIRouter(prefix="/chat", tags=["AI Chat"])

# ── Groq setup ───────────────────────────────────────────────────────────────

GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


def _get_client():
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key or api_key == "gsk_tu_clave_aqui":
        return None
    try:
        from groq import Groq
        return Groq(api_key=api_key)
    except Exception:
        return None


SYSTEM_PROMPT = """\
Eres un asistente de cocina y compras para Mercadona. Tu nombre es 'mercadITo' 🫒.

Funciones clave:
1. Cuando el usuario te diga qué ingredientes tiene, busca y sugiere recetas posibles de la base de datos.
2. Cuando el usuario elija o mencione una receta, detalla los ingredientes de Mercadona que necesita o le faltan.
3. Responde siempre en ESPAÑOL, sé amable, conciso y estructurado.
4. Incluye emojis gastronómicos cuando sea oportuno.
"""

# ── Tool definitions for LLM ─────────────────────────────────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_recipes_by_ingredients",
            "description": "Busca recetas en la base de datos a partir de una lista de ingredientes usando fuzzy matching.",
            "parameters": {
                "type": "object",
                "properties": {
                    "ingredients": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Lista de ingredientes que tiene el usuario (ej: ['arroz', 'tomate', 'huevo'])",
                    },
                },
                "required": ["ingredients"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_recipe_ingredients",
            "description": "Obtiene los ingredientes y los faltantes de una receta buscando por nombre en la base de datos.",
            "parameters": {
                "type": "object",
                "properties": {
                    "recipe_name": {"type": "string", "description": "Nombre de la receta (ej: 'Macarrones a la boloñesa')"},
                    "user_ingredients": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Ingredientes que el usuario ya tiene para descartar (opcional)",
                    },
                },
                "required": ["recipe_name"],
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
                    "servings": {"type": "integer", "description": "Número de comensales"},
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
            "parameters": {"type": "object", "properties": {}},
        },
    },
]


def _execute_tool(name: str, args: Dict[str, Any], list_id: str, db: sqlite3.Connection) -> str:
    if name == "search_recipes_by_ingredients":
        ings = args.get("ingredients", [])
        matched = search_recipes_by_ingredients(ings, db)
        return json.dumps({"recipes": matched})

    elif name == "get_recipe_ingredients":
        rec_name = args.get("recipe_name", "")
        u_ings = args.get("user_ingredients", [])
        recipe_data = search_recipe_by_name(rec_name, db, user_ingredients=u_ings)
        if not recipe_data:
            return json.dumps({"error": f"Receta '{rec_name}' no encontrada en la base de datos."})
        return json.dumps(recipe_data)

    elif name == "add_recipe_to_list":
        req = AddRecipeToListRequest(
            listId=list_id,
            servings=args.get("servings"),
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
    """
    Endpoint principal del chatbot AceitunAI.
    Combina fuzzy matching con thefuzz contra la BD y la API de Groq LLM.
    """
    msg_text = req.message.strip()
    client = _get_client()
    model = os.getenv("GROQ_MODEL", GROQ_MODEL)

    # 1. Gather context from conversation history (e.g. ingredients previously mentioned)
    past_user_messages = [m.content for m in req.history if m.role == "user"]
    past_text = " ".join(past_user_messages)
    context_ingredients = extract_ingredients(past_text)
    current_ingredients = extract_ingredients(msg_text)

    recipe_match: Optional[Dict[str, Any]] = None
    suggested_recipes_data: List[Dict[str, Any]] = []

    # 2. Decide if user is listing ingredients or requesting a recipe
    if is_giving_ingredients(msg_text):
        # User is listing ingredients: search recipes by ingredients
        all_ings = list(dict.fromkeys(context_ingredients + current_ingredients))
        suggested_recipes_data = search_recipes_by_ingredients(all_ings or current_ingredients, db)
    else:
        # User might be naming a recipe directly
        recipe_match = search_recipe_by_name(msg_text, db, user_ingredients=context_ingredients)
        if not recipe_match and current_ingredients:
            # Fallback to ingredients matching if recipe name didn't match
            suggested_recipes_data = search_recipes_by_ingredients(current_ingredients, db)

    # Prepare response containers
    recipe_suggestions: List[RecipeSuggestionItem] = []
    missing_ingredients: List[MissingIngredientItem] = []
    suggested_recipe_names: List[str] = []
    matched_recipe_name: Optional[str] = None
    added_ingredients: List[str] = []

    if recipe_match:
        matched_recipe_name = recipe_match["name"]
        for m in recipe_match.get("missingIngredients", []):
            missing_ingredients.append(
                MissingIngredientItem(
                    name=m["name"],
                    quantity=m.get("quantity", 1.0),
                    unit=m.get("unit", "ud"),
                    categoryId=m.get("categoryId", "otros"),
                    brand=m.get("brand", "Hacendado"),
                    estimatedPrice=m.get("estimatedPrice"),
                    notes=f"De receta: {recipe_match['name']}",
                    inCart=False,
                )
            )

    if suggested_recipes_data:
        for r in suggested_recipes_data:
            suggested_recipe_names.append(r["name"])
            recipe_suggestions.append(
                RecipeSuggestionItem(
                    id=r["id"],
                    name=r["name"],
                    imageEmoji=r["imageEmoji"],
                    matchScore=r["matchScore"],
                    matchedIngredients=r["matchedIngredients"],
                    missingCount=r["missingCount"],
                )
            )

    # 4. Generate LLM Reply or deterministic Fallback
    reply_text = ""

    if client:
        try:
            # Build conversation history
            system_msg = SYSTEM_PROMPT
            if recipe_match:
                system_msg += f"\nEl usuario ha seleccionado o pedido la receta: '{recipe_match['name']}' ({recipe_match['imageEmoji']}). Se le mostrarán {len(missing_ingredients)} ingredientes faltantes en la interfaz con checkboxes."
            elif suggested_recipes_data:
                system_msg += f"\nSe han encontrado {len(suggested_recipes_data)} recetas en la base de datos que coinciden con los ingredientes del usuario: {', '.join(suggested_recipe_names)}."
            messages: List[Dict[str, Any]] = [{"role": "system", "content": system_msg}]
            for msg in req.history:
                messages.append({"role": msg.role, "content": msg.content})
            messages.append({"role": "user", "content": req.message})

            MAX_TOOL_ROUNDS = 4
            for _ in range(MAX_TOOL_ROUNDS):
                completion = client.chat.completions.create(
                    model=model,
                    messages=messages,  # type: ignore
                    tools=TOOLS,  # type: ignore
                    tool_choice="auto",
                    temperature=0.6,
                    max_tokens=800,
                )
                assistant_msg = completion.choices[0].message
                tool_calls = getattr(assistant_msg, "tool_calls", None) or []
                if not tool_calls:
                    reply_text = assistant_msg.content or ""
                    break

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
                    # Side effects from tools
                    if tc.function.name == "search_recipes_by_ingredients":
                        try:
                            res_data = json.loads(tool_result)
                            for r in res_data.get("recipes", []):
                                if r["name"] not in suggested_recipe_names:
                                    suggested_recipe_names.append(r["name"])
                                    recipe_suggestions.append(
                                        RecipeSuggestionItem(
                                            id=r["id"],
                                            name=r["name"],
                                            imageEmoji=r["imageEmoji"],
                                            matchScore=r["matchScore"],
                                            matchedIngredients=r["matchedIngredients"],
                                            missingCount=r["missingCount"],
                                        )
                                    )
                        except Exception:
                            pass
                    elif tc.function.name == "get_recipe_ingredients":
                        try:
                            res_data = json.loads(tool_result)
                            matched_recipe_name = res_data.get("name", matched_recipe_name)
                            if not missing_ingredients:
                                for m in res_data.get("missingIngredients", []):
                                    missing_ingredients.append(
                                        MissingIngredientItem(
                                            name=m["name"],
                                            quantity=m.get("quantity", 1.0),
                                            unit=m.get("unit", "ud"),
                                            categoryId=m.get("categoryId", "otros"),
                                            brand=m.get("brand", "Hacendado"),
                                            estimatedPrice=m.get("estimatedPrice"),
                                            notes=f"De receta: {matched_recipe_name}",
                                            inCart=False,
                                        )
                                    )
                        except Exception:
                            pass
                    elif tc.function.name == "add_recipe_to_list":
                        try:
                            res_data = json.loads(tool_result)
                            added_ingredients.extend(res_data.get("added", []))
                        except Exception:
                            pass
            else:
                completion = client.chat.completions.create(
                    model=model,
                    messages=messages,  # type: ignore
                    temperature=0.6,
                    max_tokens=800,
                )
                reply_text = completion.choices[0].message.content or ""
        except Exception as e:
            # Fallback when LLM encounters error (e.g. rate limit, network)
            print("Groq API error fallback:", e)
            reply_text = ""

    # 5. Deterministic fallback reply if LLM didn't return text
    if not reply_text:
        if recipe_match:
            reply_text = (
                f"¡Perfecto! Para preparar **{recipe_match['name']}** {recipe_match['imageEmoji']}, "
                f"aquí tienes los ingredientes de la base de datos de Mercadona.\n\n"
                f"Marca en los checkboxes los que te falten y pulsa **Añadir a la lista**:"
            )
        elif suggested_recipes_data:
            reply_text = (
                f"Con los ingredientes que tienes (**{', '.join(current_ingredients)}**), "
                f"he encontrado estas posibles recetas en nuestra base de datos:\n\n"
                + "\n".join([f"• **{r['name']}** {r['imageEmoji']} ({r['matchScore']}% coincidencia)" for r in suggested_recipes_data])
                + "\n\nHaz clic en cualquiera de ellas o escribe su nombre para ver los ingredientes que te faltan y añadirlos a tu lista de la compra."
            )
        else:
            all_db_recipes = get_recipes_from_db(db)
            names_list = [f"• {r['name']} {r['imageEmoji']}" for r in all_db_recipes[:4]]
            reply_text = (
                "¡Hola! Dime qué ingredientes tienes en casa (por ejemplo: *arroz, tomate y huevos*) "
                "o qué receta te apetece preparar (como *Macarrones a la boloñesa*).\n\n"
                "Recetas disponibles en la base de datos:\n"
                + "\n".join(names_list)
            )

    return ChatResponse(
        reply=reply_text,
        addedIngredients=added_ingredients,
        suggestedRecipes=suggested_recipe_names,
        recipeSuggestions=recipe_suggestions,
        missingIngredients=missing_ingredients,
        recipeName=matched_recipe_name,
    )
