import re
import sqlite3
import unicodedata
from typing import List, Dict, Any, Optional, Tuple
from thefuzz import fuzz, process

def strip_accents(text: str) -> str:
    """Normalize text removing accents for reliable fuzzy comparisons."""
    return ''.join(
        c for c in unicodedata.normalize('NFD', text)
        if unicodedata.category(c) != 'Mn'
    )

def normalize_text(text: str) -> str:
    cleaned = strip_accents(text.lower().strip())
    # replace punctuation with space
    cleaned = re.sub(r'[^a-z0-9\s]', ' ', cleaned)
    return re.sub(r'\s+', ' ', cleaned).strip()

STOP_WORDS = {
    'a', 'al', 'de', 'del', 'la', 'las', 'el', 'los', 'en', 'con', 'y', 'o',
    'un', 'una', 'unos', 'unas', 'por', 'para', 'de', 'su', 'sus', 'mi', 'mis'
}


def word_match(user_word: str, target_text: str) -> int:
    """Check if user word matches any meaningful word in target text (handles plural/singular)."""
    u = normalize_text(user_word)
    if not u or len(u) < 3 or u in STOP_WORDS:
        return 0
    words = [normalize_text(w) for w in target_text.split() if len(w) >= 3 and normalize_text(w) not in STOP_WORDS]
    best = 0
    for w in words:
        if not w:
            continue
        # Direct equality
        if u == w:
            return 100
        # Direct plural / singular
        if (u.endswith('s') and u[:-1] == w) or (w.endswith('s') and w[:-1] == u):
            return 98
        if (u.endswith('es') and u[:-2] == w) or (w.endswith('es') and w[:-2] == u):
            return 98
        # Significant root match (both words >= 4 letters and one starts with the other)
        if len(u) >= 4 and len(w) >= 4 and (u.startswith(w) or w.startswith(u)):
            if min(len(u), len(w)) / max(len(u), len(w)) >= 0.75:
                best = max(best, 85)
        # Similarity ratio for words of comparable length
        if abs(len(u) - len(w)) <= 2:
            r = fuzz.ratio(u, w)
            if r >= 80:
                best = max(best, r)
    return best


def is_giving_ingredients(text: str) -> bool:
    """Check if the user message is describing ingredients they have rather than asking for a specific recipe."""
    t = text.lower().strip()
    ingredient_indicators = [
        r'\btengo\b',
        r'\bhay\b',
        r'\ben la nevera\b',
        r'\ben casa\b',
        r'\bme queda\b',
        r'\bme quedan\b',
        r'\bingredientes\b',
        r'\bdispongo\b',
        r'\bcon estos ingredientes\b',
    ]
    for pattern in ingredient_indicators:
        if re.search(pattern, t):
            return True
    # If contains commas or ' y ' with multiple items and doesn't explicitly ask for recipe
    if (',' in t or ' y ' in t) and not any(k in t for k in ['receta', 'quiero hacer', 'como se hace', 'preparar', 'cocinar']):
        return True
    return False

FOOD_AND_SHOPPING_INDICATORS = [
    # Culinary actions & meal types
    r'\b(receta|recetas|ingrediente|ingredientes|cocina|cocinar|cocinado|preparar|preparaci[oó]n|elaborar)\b',
    r'\b(comida|comer|cena|cenar|desayuno|desayunar|almuerzo|almorzar|merienda|merendar|postre|tentempi[eé]|snack|picar)\b',
    r'\b(plato|platos|men[uú]|sart[eé]n|horno|olla|cacerola|microondas|fre[ií]r|hervir|cocer|asar|hornear|guiso|guisar|salsa|bechamel|caldo)\b',
    r'\b(mercadona|hacendado|supermercado|tienda|lista|carrito|cesta|compra|comprar|precio|cu[aá]nto cuesta|cu[aá]nto vale|euros?|€)\b',
    r'\b(alimento|alimentos|nutrici[oó]n|dieta|calor[ií]as|vegano|vegetariano|sin gluten|cel[ií]aco)\b',
    
    # Food categories & common ingredients
    r'\b(arroz|pasta|macarr[oó]n|macarrones|espagueti|espaguetis|fideos|tallarines|lasa[ñn]a)\b',
    r'\b(pollo|ternera|cerdo|carne|carnes|pescado|marisco|at[uú]n|salm[oó]n|merluza|gambas|jam[oó]n|bacon|chorizo)\b',
    r'\b(huevo|huevos|tortilla|leche|queso|yogur|mantequilla|nata)\b',
    r'\b(tomate|patata|patatas|cebolla|ajo|aceite|oliva|vinagre|sal|pimienta|especias|az[uú]car|harina|pan|levadura)\b',
    r'\b(fruta|frutas|manzana|pl[aá]tano|naranja|lim[oó]n|fresa|aguacate)\b',
    r'\b(verdura|verduras|hortaliza|hortalizas|lechuga|ensalada|espinacas|zanahoria|calabac[ií]n|berenjena|pimiento)\b',
    r'\b(legumbre|legumbres|lenteja|lentejas|garbanzo|garbanzos|alubia|alubias|jud[ií]as)\b',
    r'\b(bebida|bebidas|agua|refresco|zumo|vino|cerveza|caf[eé]|t[eé]|chocolate|galleta|galletas)\b',
]

OFF_TOPIC_PATTERNS = [
    # Programming / Tech / Software
    r'\b(python|javascript|typescript|c\+\+|c\#|java|rust|golang|php|html|css|sql|docker|kubernetes|linux|windows)\b',
    r'\b(programar|programaci[oó]n|c[oó]digo|script|software|hardware|compilar|compilador|algoritmo|depurar|debug|backend|frontend)\b',
    r'\b(repositorio|git|github|pull request|commit|terminal|bash|powershell|api rest)\b',
    # Mathematics / Physics / Science non-culinary
    r'\b(derivada|integral|ecuaci[oó]n|teorema|trigonometr[ií]a|f[ií]sica cu[aá]ntica|relatividad|matem[aá]tica|matem[aá]ticas)\b',
    # Politics / Geopolitics
    r'\b(elecciones|partido pol[ií]tico|presidente del gobierno|diputado|ministro|senado|parlamento|geopol[ií]tica|guerra mundial)\b',
    # Sports & non-culinary trivia
    r'\b(champions league|la liga|bal[oó]n de oro|f[oó]rmula 1|motogp|partido de f[uú]tbol|qui[eé]n gan[oó] el mundial|mundial de f[uú]tbol)\b',
    # General non-food requests
    r'\b(capital de|qui[eé]n descubri[oó]|qui[eé]n invent[oó]|hazme un poema|escribe una canci[oó]n|redacta un ensayo|traduce al ingle[eé]s)\b',
    r'\b(coche|mec[aá]nica|rueda de un coche|reparar motor|cambiar aceite del coche)\b',
    r'\b(pel[ií]cula|pel[ií]culas|cine|serie|series|netflix|videojuego|videojuegos)\b',
    # Insults, abuse, hostility, complaints
    r'\b(tonto|tonta|tontos|tontas|idiota|idiotas|imb[eé]cil|imb[eé]ciles|est[uú]pido|est[uú]pida|in[uú]til|in[uú]tiles)\b',
    r'\b(gilipollas|cabr[oó]n|cabrones|cabrona|puta|putas|puto|putos|mierda|mierdas|hijo de puta|hija de puta|hijos de puta)\b',
    r'\b(capullo|capullos|subnormal|subnormales|bobo|boba|tarado|tarada|asqueroso|maldito|payaso|pendejo|pendeja)\b',
    r'\b(vete a la mierda|vete al carajo|que te den|a la mierda|callate|c[aá]llate|pesao|pesado|pesada|no sirves|eres una mierda|eres basura)\b',
]

GREETING_WORDS = {
    'hola', 'buenas', 'buenos', 'dias', 'días', 'tardes', 'noches', 'hey', 'saludos',
    'que', 'qué', 'tal', 'gracias', 'muchas', 'adios', 'adiós', 'hasta', 'luego', 'chao'
}


def is_off_topic_message(text: str, conn: Optional[sqlite3.Connection] = None) -> bool:
    """Detect if a user message is off-topic (unrelated to cooking, food, recipes, or shopping)."""
    t = text.lower().strip()
    if not t:
        return False

    # 1. Explicit off-topic keywords (programming, politics, sports, entertainment)
    if any(re.search(pat, t) for pat in OFF_TOPIC_PATTERNS):
        return True

    # 2. Pure greetings / courtesies are on-topic
    clean_words = [w for w in re.sub(r'[^\w\s]', ' ', t).split() if w]
    if clean_words and all(w in GREETING_WORDS for w in clean_words):
        return False

    # 3. Contains food, kitchen, cooking, recipe, or shopping words -> on-topic
    if any(re.search(pat, t) for pat in FOOD_AND_SHOPPING_INDICATORS):
        return False

    # 4. Check if text matches any recipe in the database (short queries)
    if conn is not None and len(clean_words) <= 6:
        try:
            match = search_recipe_by_name(t, conn, threshold=60)
            if match:
                return False
        except Exception:
            pass

    # Neither greeting nor culinary/supermarket related: non-related message!
    return True


def extract_ingredients(text: str) -> List[str]:
    """Extract list of ingredients from user message."""
    # Convert list-separating conjunctions to commas so items are split cleanly
    cleaned = re.sub(r'\b(y|e)\b', ',', text, flags=re.IGNORECASE)

    # Filter common conversational words
    ignore_patterns = [
        r'\b(hola|buenas|tengo|hay|en la nevera|en casa|ingredientes|ingrediente|necesito|quiero|hacer|cocinar)\b',
        r'\b(me queda|me quedan|solo|algo|un|una|unos|unas|el|la|los|las)\b',
    ]
    for pat in ignore_patterns:
        cleaned = re.sub(pat, ' ', cleaned, flags=re.IGNORECASE)

    # Split by commas, semicolons, and newlines
    parts = re.split(r'[,;\.\n]+', cleaned)
    ingredients: List[str] = []
    for part in parts:
        chunk = part.strip()
        if not chunk:
            continue
        # Check subwords
        words = [w.strip() for w in chunk.split() if len(w.strip()) > 2]
        if len(words) == 1:
            if words[0].lower() not in [i.lower() for i in ingredients]:
                ingredients.append(words[0])
        elif len(words) > 1:
            # Add full chunk if concise, else add individual words
            if len(chunk) <= 30:
                if chunk.lower() not in [i.lower() for i in ingredients]:
                    ingredients.append(chunk)
            else:
                for w in words:
                    if w.lower() not in [i.lower() for i in ingredients]:
                        ingredients.append(w)
    return ingredients

def get_recipes_from_db(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    """Retrieve all recipes with complete ingredient data from SQLite DB."""
    cursor = conn.cursor()
    recipes: List[Dict[str, Any]] = []

    # First check standard 'recipes' table
    cursor.execute("""
        SELECT r.id, r.name, r.description, r.category, r.servings, r.prep_time_min, r.image_emoji
        FROM recipes r
    """)
    rows = cursor.fetchall()

    for r in rows:
        r_id = r[0] if isinstance(r, tuple) else r["id"]
        r_name = r[1] if isinstance(r, tuple) else r["name"]
        r_desc = r[2] if isinstance(r, tuple) else r["description"]
        r_cat = r[3] if isinstance(r, tuple) else r["category"]
        r_serv = r[4] if isinstance(r, tuple) else r["servings"]
        r_time = r[5] if isinstance(r, tuple) else r["prep_time_min"]
        r_emoji = r[6] if isinstance(r, tuple) else r["image_emoji"]

        # Fetch ingredients for this recipe
        cursor.execute("""
            SELECT id, name, quantity, unit, category_id, estimated_price, is_optional
            FROM recipe_ingredients
            WHERE recipe_id = ?
        """, (r_id,))
        ing_rows = cursor.fetchall()
        ingredients = []
        for i in ing_rows:
            i_name = i[1] if isinstance(i, tuple) else i["name"]
            i_qty = float(i[2] if isinstance(i, tuple) else i["quantity"])
            i_unit = i[3] if isinstance(i, tuple) else i["unit"]
            i_cat = i[4] if isinstance(i, tuple) else i["category_id"]
            i_price = float(i[5]) if (isinstance(i, tuple) and i[5] is not None) else (float(i["estimated_price"]) if (not isinstance(i, tuple) and i["estimated_price"] is not None) else None)
            ingredients.append({
                "name": i_name,
                "quantity": i_qty,
                "unit": i_unit,
                "categoryId": i_cat,
                "brand": "Hacendado",
                "estimatedPrice": i_price,
            })

        recipes.append({
            "id": str(r_id),
            "name": str(r_name),
            "description": r_desc or "",
            "category": r_cat or "general",
            "servings": int(r_serv or 2),
            "prepTimeMin": int(r_time or 30),
            "imageEmoji": r_emoji or "🍽️",
            "ingredients": ingredients,
        })

    # Also check if 'recetas' + 'productos' exist for any missing recipes
    try:
        cursor.execute("SELECT id, nombre FROM recetas")
        merc_recetas = cursor.fetchall()
        existing_names = [normalize_text(rc["name"]) for rc in recipes]

        for mr in merc_recetas:
            mr_id = mr[0] if isinstance(mr, tuple) else mr["id"]
            mr_name = mr[1] if isinstance(mr, tuple) else mr["nombre"]
            if normalize_text(mr_name) in existing_names:
                continue

            # Fetch ingredients via join
            cursor.execute("""
                SELECT p.nombre, p.precio, ri.cantidad_necesaria_gr
                FROM receta_ingredientes ri
                JOIN productos p ON p.id = ri.producto_id
                WHERE ri.receta_id = ?
            """, (mr_id,))
            p_rows = cursor.fetchall()
            ingredients = []
            for p in p_rows:
                p_name = p[0] if isinstance(p, tuple) else p["nombre"]
                p_price = float(p[1]) if (isinstance(p, tuple) and p[1] is not None) else None
                ingredients.append({
                    "name": p_name,
                    "quantity": 1.0,
                    "unit": "ud",
                    "categoryId": "otros",
                    "brand": "Hacendado",
                    "estimatedPrice": p_price,
                })

            emoji = "🍝" if "macarr" in mr_name.lower() else ("🍳" if "arroz" in mr_name.lower() or "huevo" in mr_name.lower() else "🍽️")
            recipes.append({
                "id": f"receta_{mr_id}",
                "name": str(mr_name),
                "description": f"Receta de {mr_name}",
                "category": "comida",
                "servings": 2,
                "prepTimeMin": 25,
                "imageEmoji": emoji,
                "ingredients": ingredients,
            })
    except Exception:
        pass

    return recipes

def match_ingredient_to_user(ing_name: str, user_ingredients: List[str]) -> Tuple[bool, int]:
    """Returns True and highest score if ing_name matches any user ingredient using thefuzz."""
    norm_ing = normalize_text(ing_name)
    best_score = 0
    for u_ing in user_ingredients:
        norm_u = normalize_text(u_ing)
        if not norm_u:
            continue
        # direct word / token matching
        w_score = word_match(norm_u, norm_ing)
        t_score = fuzz.token_set_ratio(norm_u, norm_ing)
        score = max(w_score, t_score)
        if score > best_score:
            best_score = score

    return (best_score >= 65, best_score)

def search_recipes_by_ingredients(
    user_ingredients: List[str],
    conn: sqlite3.Connection,
    threshold: int = 25,
) -> List[Dict[str, Any]]:
    """
    Search recipes in the database using thefuzz fuzzy matching against user ingredients.
    Returns matching recipes sorted by match score.
    """
    all_recipes = get_recipes_from_db(conn)
    results = []

    for recipe in all_recipes:
        ings = recipe.get("ingredients", [])
        if not ings:
            continue

        matched_ings = []
        missing_ings = []

        for ing in ings:
            is_matched, score = match_ingredient_to_user(ing["name"], user_ingredients)
            if is_matched:
                matched_ings.append(ing["name"])
            else:
                missing_ings.append(ing)

        matched_count = len(matched_ings)
        total_count = len(ings)
        match_percentage = int((matched_count / total_count) * 100) if total_count > 0 else 0

        if matched_count > 0 and match_percentage >= threshold:
            results.append({
                "id": recipe["id"],
                "name": recipe["name"],
                "imageEmoji": recipe["imageEmoji"],
                "matchScore": match_percentage,
                "matchedIngredients": matched_ings,
                "missingIngredients": missing_ings,
                "missingCount": len(missing_ings),
                "totalCount": total_count,
            })

    # Sort by match score descending, then matched count descending
    results.sort(key=lambda r: (r["matchScore"], len(r["matchedIngredients"])), reverse=True)
    return results

def search_recipe_by_name(
    recipe_query: str,
    conn: sqlite3.Connection,
    user_ingredients: Optional[List[str]] = None,
    threshold: int = 65,
) -> Optional[Dict[str, Any]]:
    """
    Fuzzy match a recipe name against the database using thefuzz.
    Returns recipe detail with missing ingredients.
    """
    all_recipes = get_recipes_from_db(conn)
    if not all_recipes:
        return None

    names = [r["name"] for r in all_recipes]
    norm_query = normalize_text(recipe_query)
    if not norm_query or len(norm_query) < 3:
        return None

    best_match_name = None
    best_score = 0

    for r_name in names:
        norm_r = normalize_text(r_name)
        t_set = fuzz.token_set_ratio(norm_query, norm_r)
        t_sort = fuzz.token_sort_ratio(norm_query, norm_r)
        w_score = max((word_match(w, norm_r) for w in norm_query.split() if w not in STOP_WORDS), default=0)

        score = max(t_set, t_sort)
        if w_score >= 85 and w_score > score:
            score = w_score

        if score > best_score:
            best_score = score
            best_match_name = r_name

    if best_score < threshold or not best_match_name:
        return None

    matched_recipe = next((r for r in all_recipes if r["name"] == best_match_name), None)
    if not matched_recipe:
        return None

    ings = matched_recipe.get("ingredients", [])
    matched_ings = []
    missing_ings = []

    user_ings = user_ingredients or []
    for ing in ings:
        if user_ings:
            is_matched, _ = match_ingredient_to_user(ing["name"], user_ings)
            if is_matched:
                matched_ings.append(ing["name"])
            else:
                missing_ings.append(ing)
        else:
            missing_ings.append(ing)

    return {
        "id": matched_recipe["id"],
        "name": matched_recipe["name"],
        "imageEmoji": matched_recipe["imageEmoji"],
        "matchScore": score,
        "matchedIngredients": matched_ings,
        "missingIngredients": missing_ings,
        "missingCount": len(missing_ings),
        "totalCount": len(ings),
    }
