import time
import uuid
import sqlite3
from typing import Optional, List, Dict, Any
from .schemas import (
    ShoppingItemCreate,
    ShoppingItemUpdate,
    ShoppingItemResponse,
    BudgetStatsResponse,
    ShoppingListCreate,
    ShoppingListUpdate,
    ShoppingListResponse,
    RecipeCreate,
    RecipeUpdate,
    RecipeResponse,
    RecipeIngredientResponse,
    RecipeIngredientCreate,
    AddRecipeToListRequest,
)
from .initial_data import INITIAL_SAMPLE_ITEMS, MERCADONA_CATEGORIES

# --- LISTS CRUD ---

def get_lists(conn: sqlite3.Connection) -> List[ShoppingListResponse]:
    cursor = conn.cursor()
    cursor.execute("""
        SELECT l.*, 
            COUNT(i.id) as total_count,
            SUM(CASE WHEN i.in_cart = 1 THEN 1 ELSE 0 END) as cart_count,
            SUM(IFNULL(i.estimated_price * i.quantity, 0)) as total_cost,
            SUM(CASE WHEN i.in_cart = 1 THEN IFNULL(i.estimated_price * i.quantity, 0) ELSE 0 END) as cart_cost
        FROM shopping_lists l
        LEFT JOIN shopping_items i ON l.id = i.list_id
        WHERE l.is_archived = 0
        GROUP BY l.id
        ORDER BY l.created_at ASC
    """)
    rows = cursor.fetchall()
    results = []
    for r in rows:
        results.append(ShoppingListResponse(
            id=r["id"],
            name=r["name"],
            emoji=r["emoji"],
            color=r["color"],
            itemCount=r["total_count"] or 0,
            cartCount=r["cart_count"] or 0,
            totalEstimated=round(float(r["total_cost"] or 0.0), 2),
            cartEstimated=round(float(r["cart_cost"] or 0.0), 2),
            createdAt=int(r["created_at"])
        ))
    return results

def get_list(conn: sqlite3.Connection, list_id: str) -> Optional[ShoppingListResponse]:
    cursor = conn.cursor()
    cursor.execute("""
        SELECT l.*, 
            COUNT(i.id) as total_count,
            SUM(CASE WHEN i.in_cart = 1 THEN 1 ELSE 0 END) as cart_count,
            SUM(IFNULL(i.estimated_price * i.quantity, 0)) as total_cost,
            SUM(CASE WHEN i.in_cart = 1 THEN IFNULL(i.estimated_price * i.quantity, 0) ELSE 0 END) as cart_cost
        FROM shopping_lists l
        LEFT JOIN shopping_items i ON l.id = i.list_id
        WHERE l.id = ?
        GROUP BY l.id
    """, (list_id,))
    r = cursor.fetchone()
    if not r:
        return None
    return ShoppingListResponse(
        id=r["id"],
        name=r["name"],
        emoji=r["emoji"],
        color=r["color"],
        itemCount=r["total_count"] or 0,
        cartCount=r["cart_count"] or 0,
        totalEstimated=round(float(r["total_cost"] or 0.0), 2),
        cartEstimated=round(float(r["cart_cost"] or 0.0), 2),
        createdAt=int(r["created_at"])
    )

def create_list(conn: sqlite3.Connection, list_in: ShoppingListCreate) -> ShoppingListResponse:
    new_id = f"list_{int(time.time() * 1000)}_{uuid.uuid4().hex[:6]}"
    now = int(time.time() * 1000)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO shopping_lists (id, name, emoji, color, is_archived, created_at)
        VALUES (?, ?, ?, ?, 0, ?)
    """, (new_id, list_in.name, list_in.emoji, list_in.color, now))
    conn.commit()
    return get_list(conn, new_id) # type: ignore

def update_list(conn: sqlite3.Connection, list_id: str, list_in: ShoppingListUpdate) -> Optional[ShoppingListResponse]:
    current = get_list(conn, list_id)
    if not current:
        return None
    
    update_dict = list_in.model_dump(exclude_unset=True)
    clauses = []
    params = []
    for k, v in update_dict.items():
        if k == "isArchived":
            clauses.append("is_archived = ?")
            params.append(1 if v else 0)
        elif k in ["name", "emoji", "color"]:
            clauses.append(f"{k} = ?")
            params.append(v)

    if clauses:
        params.append(list_id)
        cursor = conn.cursor()
        cursor.execute(f"UPDATE shopping_lists SET {', '.join(clauses)} WHERE id = ?", params)
        conn.commit()

    return get_list(conn, list_id)

def delete_list(conn: sqlite3.Connection, list_id: str) -> bool:
    cursor = conn.cursor()
    # Delete items in list first
    cursor.execute("DELETE FROM shopping_items WHERE list_id = ?", (list_id,))
    cursor.execute("DELETE FROM shopping_lists WHERE id = ?", (list_id,))
    conn.commit()
    return cursor.rowcount > 0


# --- ITEMS CRUD ---

def row_to_item(row: sqlite3.Row) -> ShoppingItemResponse:
    in_cart = bool(row["in_cart"] if "in_cart" in row.keys() else row["completed"])
    completed = bool(row["completed"]) or in_cart
    return ShoppingItemResponse(
        id=row["id"],
        name=row["name"],
        listId=row["list_id"] if "list_id" in row.keys() else "default",
        categoryId=row["category_id"],
        brand=row["brand"], # type: ignore
        quantity=float(row["quantity"]),
        unit=row["unit"], # type: ignore
        estimatedPrice=float(row["estimated_price"]) if row["estimated_price"] is not None else None,
        notes=row["notes"],
        completed=completed,
        inCart=in_cart,
        priority=row["priority"], # type: ignore
        createdAt=int(row["created_at"])
    )

def get_items(
    conn: sqlite3.Connection,
    list_id: Optional[str] = None,
    in_cart: Optional[bool] = None,
    category_id: Optional[str] = None,
    completed: Optional[bool] = None,
    search: Optional[str] = None,
    sort_by: str = "aisle"
) -> List[ShoppingItemResponse]:
    cursor = conn.cursor()
    query = "SELECT * FROM shopping_items WHERE 1=1"
    params: List[Any] = []

    if list_id and list_id != "all":
        query += " AND list_id = ?"
        params.append(list_id)

    if in_cart is not None:
        query += " AND in_cart = ?"
        params.append(1 if in_cart else 0)

    if category_id and category_id != "all":
        query += " AND category_id = ?"
        params.append(category_id)

    if completed is not None:
        query += " AND completed = ?"
        params.append(1 if completed else 0)

    if search:
        query += " AND (LOWER(name) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(IFNULL(notes, '')) LIKE ?)"
        s = f"%{search.lower()}%"
        params.extend([s, s, s])

    cursor.execute(query, params)
    rows = cursor.fetchall()
    items = [row_to_item(r) for r in rows]

    category_order = {c["id"]: c["order"] for c in MERCADONA_CATEGORIES}

    def sort_key(item: ShoppingItemResponse):
        # Items in cart go to the bottom unless sorting specifically by cart
        cart_rank = 1 if item.inCart else 0
        if sort_by == "aisle":
            aisle_rank = category_order.get(item.categoryId, 99)
            return (cart_rank, aisle_rank, item.name.lower())
        elif sort_by == "name":
            return (cart_rank, item.name.lower())
        elif sort_by == "price-asc":
            return (cart_rank, item.estimatedPrice or 0.0)
        elif sort_by == "price-desc":
            return (cart_rank, -(item.estimatedPrice or 0.0))
        elif sort_by == "created":
            return (cart_rank, -item.createdAt)
        return (cart_rank, item.name.lower())

    return sorted(items, key=sort_key)

def get_item(conn: sqlite3.Connection, item_id: str) -> Optional[ShoppingItemResponse]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM shopping_items WHERE id = ?", (item_id,))
    row = cursor.fetchone()
    if row:
        return row_to_item(row)
    return None

def create_item(conn: sqlite3.Connection, item_in: ShoppingItemCreate) -> ShoppingItemResponse:
    new_id = f"item_{int(time.time() * 1000)}_{uuid.uuid4().hex[:6]}"
    created_at = int(time.time() * 1000)
    
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO shopping_items (
            id, list_id, name, category_id, brand, quantity, unit, estimated_price, notes, completed, in_cart, priority, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
    """, (
        new_id,
        item_in.listId or "default",
        item_in.name,
        item_in.categoryId,
        item_in.brand,
        item_in.quantity,
        item_in.unit,
        item_in.estimatedPrice,
        item_in.notes,
        item_in.priority,
        created_at
    ))
    conn.commit()
    return get_item(conn, new_id) # type: ignore

def update_item(conn: sqlite3.Connection, item_id: str, item_in: ShoppingItemUpdate) -> Optional[ShoppingItemResponse]:
    current = get_item(conn, item_id)
    if not current:
        return None

    update_dict = item_in.model_dump(exclude_unset=True)
    if not update_dict:
        return current

    clauses = []
    params = []

    mapping = {
        "name": "name",
        "listId": "list_id",
        "categoryId": "category_id",
        "brand": "brand",
        "quantity": "quantity",
        "unit": "unit",
        "estimatedPrice": "estimated_price",
        "notes": "notes",
        "completed": "completed",
        "inCart": "in_cart",
        "priority": "priority"
    }

    for key, val in update_dict.items():
        if key in mapping:
            col = mapping[key]
            if key in ["completed", "inCart"]:
                val = 1 if val else 0
            clauses.append(f"{col} = ?")
            params.append(val)

    if clauses:
        params.append(item_id)
        sql = f"UPDATE shopping_items SET {', '.join(clauses)} WHERE id = ?"
        cursor = conn.cursor()
        cursor.execute(sql, params)
        conn.commit()

    return get_item(conn, item_id)

def toggle_cart_item(conn: sqlite3.Connection, item_id: str) -> Optional[ShoppingItemResponse]:
    """Moves an item into the cart or takes it out back to the list."""
    current = get_item(conn, item_id)
    if not current:
        return None

    new_cart_state = 0 if current.inCart else 1
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE shopping_items 
        SET in_cart = ?, completed = ?
        WHERE id = ?
    """, (new_cart_state, new_cart_state, item_id))
    conn.commit()
    return get_item(conn, item_id)

def move_all_to_cart(conn: sqlite3.Connection, list_id: str) -> int:
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE shopping_items 
        SET in_cart = 1, completed = 1
        WHERE list_id = ? AND in_cart = 0
    """, (list_id,))
    conn.commit()
    return cursor.rowcount

def clear_cart(conn: sqlite3.Connection, list_id: Optional[str] = None) -> int:
    """Removes items from cart (they can be returned to list or deleted). Here we empty the cart."""
    cursor = conn.cursor()
    if list_id and list_id != "all":
        cursor.execute("DELETE FROM shopping_items WHERE list_id = ? AND in_cart = 1", (list_id,))
    else:
        cursor.execute("DELETE FROM shopping_items WHERE in_cart = 1")
    conn.commit()
    return cursor.rowcount

def delete_item(conn: sqlite3.Connection, item_id: str) -> bool:
    cursor = conn.cursor()
    cursor.execute("DELETE FROM shopping_items WHERE id = ?", (item_id,))
    conn.commit()
    return cursor.rowcount > 0

def clear_completed(conn: sqlite3.Connection, list_id: Optional[str] = None) -> int:
    cursor = conn.cursor()
    if list_id and list_id != "all":
        cursor.execute("DELETE FROM shopping_items WHERE list_id = ? AND (completed = 1 OR in_cart = 1)", (list_id,))
    else:
        cursor.execute("DELETE FROM shopping_items WHERE completed = 1 OR in_cart = 1")
    conn.commit()
    return cursor.rowcount

def seed_sample_data(conn: sqlite3.Connection, list_id: str = "default") -> None:
    cursor = conn.cursor()
    cursor.execute("DELETE FROM shopping_items WHERE list_id = ?", (list_id,))
    now = int(time.time() * 1000)

    for idx, sample in enumerate(INITIAL_SAMPLE_ITEMS):
        cursor.execute("""
            INSERT INTO shopping_items (
                id, list_id, name, category_id, brand, quantity, unit, estimated_price, notes, completed, in_cart, priority, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            sample["id"],
            list_id,
            sample["name"],
            sample["categoryId"],
            sample["brand"],
            sample["quantity"],
            sample["unit"],
            sample.get("estimatedPrice"),
            sample.get("notes"),
            1 if sample.get("completed") else 0,
            1 if sample.get("completed") else 0, # in_cart matches initial completed
            sample["priority"],
            now - (idx * 10000)
        ))
    conn.commit()

def calculate_stats(conn: sqlite3.Connection, list_id: Optional[str] = None) -> BudgetStatsResponse:
    items = get_items(conn, list_id=list_id)
    total_items = len(items)
    cart_items = [i for i in items if i.inCart]
    list_items = [i for i in items if not i.inCart]

    cart_count = len(cart_items)
    list_count = len(list_items)

    total_estimated = sum((i.estimatedPrice or 0.0) * (i.quantity or 1.0) for i in items)
    cart_estimated = sum((i.estimatedPrice or 0.0) * (i.quantity or 1.0) for i in cart_items)
    list_estimated = sum((i.estimatedPrice or 0.0) * (i.quantity or 1.0) for i in list_items)

    progress = round((cart_count / total_items) * 100) if total_items > 0 else 0

    return BudgetStatsResponse(
        totalItems=total_items,
        listItemsCount=list_count,
        cartItemsCount=cart_count,
        totalEstimated=round(total_estimated, 2),
        listEstimated=round(list_estimated, 2),
        cartEstimated=round(cart_estimated, 2),
        progressPercentage=progress
    )


# ── RECIPES CRUD ──────────────────────────────────────────────────────────────

def _row_to_ingredient(row: sqlite3.Row) -> RecipeIngredientResponse:
    return RecipeIngredientResponse(
        id=row["id"],
        recipeId=row["recipe_id"],
        name=row["name"],
        quantity=float(row["quantity"]),
        unit=row["unit"],  # type: ignore
        categoryId=row["category_id"],
        estimatedPrice=float(row["estimated_price"]) if row["estimated_price"] is not None else None,
        isOptional=bool(row["is_optional"]),
    )

def _get_recipe_ingredients(conn: sqlite3.Connection, recipe_id: str) -> List[RecipeIngredientResponse]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY rowid", (recipe_id,))
    return [_row_to_ingredient(r) for r in cursor.fetchall()]

def _row_to_recipe(conn: sqlite3.Connection, row: sqlite3.Row) -> RecipeResponse:
    ingredients = _get_recipe_ingredients(conn, row["id"])
    return RecipeResponse(
        id=row["id"],
        name=row["name"],
        description=row["description"],
        category=row["category"],
        servings=int(row["servings"]),
        prepTimeMin=int(row["prep_time_min"]),
        imageEmoji=row["image_emoji"],
        tags=row["tags"] or "",
        ingredients=ingredients,
        createdAt=int(row["created_at"]),
    )

def get_recipes(conn: sqlite3.Connection, search: Optional[str] = None, category: Optional[str] = None) -> List[RecipeResponse]:
    cursor = conn.cursor()
    query = "SELECT * FROM recipes WHERE 1=1"
    params: List[Any] = []
    if search:
        query += " AND (LOWER(name) LIKE ? OR LOWER(IFNULL(description,'')) LIKE ? OR LOWER(tags) LIKE ?)"
        s = f"%{search.lower()}%"
        params.extend([s, s, s])
    if category and category != "all":
        query += " AND category = ?"
        params.append(category)
    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    return [_row_to_recipe(conn, r) for r in cursor.fetchall()]

def get_recipe(conn: sqlite3.Connection, recipe_id: str) -> Optional[RecipeResponse]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM recipes WHERE id = ?", (recipe_id,))
    row = cursor.fetchone()
    if not row:
        return None
    return _row_to_recipe(conn, row)

def create_recipe(conn: sqlite3.Connection, recipe_in: RecipeCreate) -> RecipeResponse:
    new_id = f"recipe_{int(time.time() * 1000)}_{uuid.uuid4().hex[:6]}"
    now = int(time.time() * 1000)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO recipes (id, name, description, category, servings, prep_time_min, image_emoji, tags, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (new_id, recipe_in.name, recipe_in.description, recipe_in.category,
          recipe_in.servings, recipe_in.prepTimeMin, recipe_in.imageEmoji, recipe_in.tags, now))

    for ing in recipe_in.ingredients:
        ing_id = f"ing_{int(time.time() * 1000)}_{uuid.uuid4().hex[:6]}"
        cursor.execute("""
            INSERT INTO recipe_ingredients (id, recipe_id, name, quantity, unit, category_id, estimated_price, is_optional)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (ing_id, new_id, ing.name, ing.quantity, ing.unit, ing.categoryId,
              ing.estimatedPrice, 1 if ing.isOptional else 0))
    conn.commit()
    return get_recipe(conn, new_id)  # type: ignore

def update_recipe(conn: sqlite3.Connection, recipe_id: str, recipe_in: RecipeUpdate) -> Optional[RecipeResponse]:
    if not get_recipe(conn, recipe_id):
        return None
    update_dict = recipe_in.model_dump(exclude_unset=True)
    mapping = {
        "name": "name", "description": "description", "category": "category",
        "servings": "servings", "prepTimeMin": "prep_time_min",
        "imageEmoji": "image_emoji", "tags": "tags",
    }
    clauses, params = [], []
    for k, v in update_dict.items():
        if k in mapping:
            clauses.append(f"{mapping[k]} = ?")
            params.append(v)
    if clauses:
        params.append(recipe_id)
        conn.cursor().execute(f"UPDATE recipes SET {', '.join(clauses)} WHERE id = ?", params)
        conn.commit()
    return get_recipe(conn, recipe_id)

def delete_recipe(conn: sqlite3.Connection, recipe_id: str) -> bool:
    cursor = conn.cursor()
    cursor.execute("DELETE FROM recipe_ingredients WHERE recipe_id = ?", (recipe_id,))
    cursor.execute("DELETE FROM recipes WHERE id = ?", (recipe_id,))
    conn.commit()
    return cursor.rowcount > 0

def add_recipe_to_list(
    conn: sqlite3.Connection,
    recipe_id: str,
    req: AddRecipeToListRequest,
) -> List[ShoppingItemResponse]:
    """Add all (or non-optional) recipe ingredients as shopping items to a list."""
    recipe = get_recipe(conn, recipe_id)
    if not recipe:
        return []

    scale = (req.servings / recipe.servings) if req.servings and recipe.servings else 1.0
    added: List[ShoppingItemResponse] = []
    now = int(time.time() * 1000)

    for idx, ing in enumerate(recipe.ingredients):
        if req.skipOptional and ing.isOptional:
            continue
        item_id = f"item_{now + idx}_{uuid.uuid4().hex[:6]}"
        scaled_qty = round(ing.quantity * scale, 2)
        conn.cursor().execute("""
            INSERT INTO shopping_items
                (id, list_id, name, category_id, brand, quantity, unit, estimated_price, notes, completed, in_cart, priority, created_at)
            VALUES (?, ?, ?, ?, 'General', ?, ?, ?, ?, 0, 0, 'media', ?)
        """, (
            item_id, req.listId, ing.name, ing.categoryId,
            scaled_qty, ing.unit, ing.estimatedPrice,
            f"De receta: {recipe.name}", now + idx,
        ))
        conn.commit()
        item = get_item(conn, item_id)
        if item:
            added.append(item)

    return added

def get_list_as_json(conn: sqlite3.Connection, list_id: str) -> Dict[str, Any]:
    """Returns the full list in structured JSON format, ready for AI consumption."""
    lst = get_list(conn, list_id)
    if not lst:
        return {}
    items = get_items(conn, list_id=list_id)
    pending = [i for i in items if not i.inCart]
    in_cart = [i for i in items if i.inCart]

    def item_to_dict(i: ShoppingItemResponse) -> Dict[str, Any]:
        return {
            "id": i.id,
            "name": i.name,
            "quantity": i.quantity,
            "unit": i.unit,
            "categoryId": i.categoryId,
            "estimatedPrice": i.estimatedPrice,
            "notes": i.notes,
            "priority": i.priority,
            "inCart": i.inCart,
        }

    return {
        "list": {
            "id": lst.id,
            "name": lst.name,
            "emoji": lst.emoji,
        },
        "summary": {
            "totalItems": len(items),
            "pendingCount": len(pending),
            "inCartCount": len(in_cart),
            "totalEstimated": lst.totalEstimated,
            "cartEstimated": lst.cartEstimated,
        },
        "pending": [item_to_dict(i) for i in pending],
        "inCart": [item_to_dict(i) for i in in_cart],
    }
