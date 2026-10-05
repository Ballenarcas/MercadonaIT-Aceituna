import time
import uuid
import sqlite3
from typing import Optional, List, Dict, Any
from .schemas import ShoppingItemCreate, ShoppingItemUpdate, ShoppingItemResponse, BudgetStatsResponse
from .initial_data import INITIAL_SAMPLE_ITEMS, MERCADONA_CATEGORIES

def row_to_item(row: sqlite3.Row) -> ShoppingItemResponse:
    return ShoppingItemResponse(
        id=row["id"],
        name=row["name"],
        categoryId=row["category_id"],
        brand=row["brand"], # type: ignore
        quantity=float(row["quantity"]),
        unit=row["unit"], # type: ignore
        estimatedPrice=float(row["estimated_price"]) if row["estimated_price"] is not None else None,
        notes=row["notes"],
        completed=bool(row["completed"]),
        priority=row["priority"], # type: ignore
        createdAt=int(row["created_at"])
    )

def get_items(
    conn: sqlite3.Connection,
    category_id: Optional[str] = None,
    completed: Optional[bool] = None,
    search: Optional[str] = None,
    sort_by: str = "aisle"
) -> List[ShoppingItemResponse]:
    cursor = conn.cursor()
    query = "SELECT * FROM shopping_items WHERE 1=1"
    params: List[Any] = []

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
        comp_rank = 1 if item.completed else 0
        if sort_by == "aisle":
            aisle_rank = category_order.get(item.categoryId, 99)
            return (comp_rank, aisle_rank, item.name.lower())
        elif sort_by == "name":
            return (comp_rank, item.name.lower())
        elif sort_by == "price-asc":
            return (comp_rank, item.estimatedPrice or 0.0)
        elif sort_by == "price-desc":
            return (comp_rank, -(item.estimatedPrice or 0.0))
        elif sort_by == "created":
            return (comp_rank, -item.createdAt)
        return (comp_rank, item.name.lower())

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
            id, name, category_id, brand, quantity, unit, estimated_price, notes, completed, priority, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        new_id,
        item_in.name,
        item_in.categoryId,
        item_in.brand,
        item_in.quantity,
        item_in.unit,
        item_in.estimatedPrice,
        item_in.notes,
        0,
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
        "categoryId": "category_id",
        "brand": "brand",
        "quantity": "quantity",
        "unit": "unit",
        "estimatedPrice": "estimated_price",
        "notes": "notes",
        "completed": "completed",
        "priority": "priority"
    }

    for key, val in update_dict.items():
        if key in mapping:
            col = mapping[key]
            if key == "completed":
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

def toggle_item(conn: sqlite3.Connection, item_id: str) -> Optional[ShoppingItemResponse]:
    current = get_item(conn, item_id)
    if not current:
        return None

    new_completed = 0 if current.completed else 1
    cursor = conn.cursor()
    cursor.execute("UPDATE shopping_items SET completed = ? WHERE id = ?", (new_completed, item_id))
    conn.commit()
    return get_item(conn, item_id)

def delete_item(conn: sqlite3.Connection, item_id: str) -> bool:
    cursor = conn.cursor()
    cursor.execute("DELETE FROM shopping_items WHERE id = ?", (item_id,))
    conn.commit()
    return cursor.rowcount > 0

def clear_completed(conn: sqlite3.Connection) -> int:
    cursor = conn.cursor()
    cursor.execute("DELETE FROM shopping_items WHERE completed = 1")
    conn.commit()
    return cursor.rowcount

def clear_all(conn: sqlite3.Connection) -> int:
    cursor = conn.cursor()
    cursor.execute("DELETE FROM shopping_items")
    conn.commit()
    return cursor.rowcount

def seed_sample_data(conn: sqlite3.Connection) -> None:
    cursor = conn.cursor()
    cursor.execute("DELETE FROM shopping_items")
    now = int(time.time() * 1000)

    for idx, sample in enumerate(INITIAL_SAMPLE_ITEMS):
        cursor.execute("""
            INSERT INTO shopping_items (
                id, name, category_id, brand, quantity, unit, estimated_price, notes, completed, priority, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            sample["id"],
            sample["name"],
            sample["categoryId"],
            sample["brand"],
            sample["quantity"],
            sample["unit"],
            sample.get("estimatedPrice"),
            sample.get("notes"),
            1 if sample["completed"] else 0,
            sample["priority"],
            now - (idx * 10000)
        ))
    conn.commit()

def calculate_stats(conn: sqlite3.Connection) -> BudgetStatsResponse:
    items = get_items(conn)
    total_items = len(items)
    completed_items = sum(1 for i in items if i.completed)
    pending_items = total_items - completed_items

    total_estimated = 0.0
    pending_estimated = 0.0
    completed_estimated = 0.0

    for item in items:
        price = (item.estimatedPrice or 0.0) * (item.quantity or 1.0)
        total_estimated += price
        if item.completed:
            completed_estimated += price
        else:
            pending_estimated += price

    progress = round((completed_items / total_items) * 100) if total_items > 0 else 0

    return BudgetStatsResponse(
        totalItems=total_items,
        completedItems=completed_items,
        pendingItems=pending_items,
        totalEstimated=round(total_estimated, 2),
        pendingEstimated=round(pending_estimated, 2),
        completedEstimated=round(completed_estimated, 2),
        progressPercentage=progress
    )
