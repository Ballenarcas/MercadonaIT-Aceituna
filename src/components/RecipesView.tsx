import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, ChefHat, Clock, Users, ShoppingCart, Trash2, Tag, X } from 'lucide-react';
import type { Recipe, RecipeCategory, ShoppingList, Unit } from '../types';
import { api } from '../services/api';

interface RecipesViewProps {
  activeList: ShoppingList;
  onIngredientAdded: () => void; // refresh shopping list
}

const RECIPE_CATEGORIES: { id: RecipeCategory; label: string; emoji: string }[] = [
  { id: 'all', label: 'Todas', emoji: '🍽️' },
  { id: 'desayuno', label: 'Desayuno', emoji: '☀️' },
  { id: 'comida', label: 'Comida', emoji: '🍲' },
  { id: 'cena', label: 'Cena', emoji: '🌙' },
  { id: 'postre', label: 'Postre', emoji: '🍰' },
  { id: 'snack', label: 'Snack', emoji: '🥨' },
  { id: 'general', label: 'General', emoji: '📋' },
];

const UNITS: Unit[] = ['ud', 'kg', 'g', 'pack', 'litro', 'docena', 'bandeja'];

// ── Create Recipe Modal ───────────────────────────────────────────────────────

interface CreateRecipeModalProps {
  onClose: () => void;
  onCreated: (recipe: Recipe) => void;
}

const CreateRecipeModal: React.FC<CreateRecipeModalProps> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [servings, setServings] = useState(2);
  const [prepTimeMin, setPrepTimeMin] = useState(30);
  const [imageEmoji, setImageEmoji] = useState('🍽️');
  const [tags, setTags] = useState('');
  const [ingredients, setIngredients] = useState([
    { name: '', quantity: 1, unit: 'ud' as Unit, categoryId: 'otros', estimatedPrice: '', isOptional: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addIngredient = () =>
    setIngredients((prev) => [
      ...prev,
      { name: '', quantity: 1, unit: 'ud' as Unit, categoryId: 'otros', estimatedPrice: '', isOptional: false },
    ]);

  const removeIngredient = (i: number) =>
    setIngredients((prev) => prev.filter((_, idx) => idx !== i));

  const updateIngredient = (i: number, key: string, value: unknown) =>
    setIngredients((prev) => prev.map((ing, idx) => (idx === i ? { ...ing, [key]: value } : ing)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('El nombre es obligatorio');
    const validIngredients = ingredients.filter((ing) => ing.name.trim());
    if (validIngredients.length === 0) return setError('Añade al menos un ingrediente');

    setLoading(true);
    setError('');
    try {
      const created = await api.createRecipe({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        servings,
        prepTimeMin,
        imageEmoji,
        tags,
        ingredients: validIngredients.map((ing) => ({
          id: '',
          recipeId: '',
          name: ing.name.trim(),
          quantity: ing.quantity,
          unit: ing.unit,
          categoryId: ing.categoryId,
          estimatedPrice: ing.estimatedPrice ? parseFloat(ing.estimatedPrice as string) : undefined,
          isOptional: ing.isOptional,
        })),
      });
      onCreated(created);
    } catch {
      setError('Error al crear la receta. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-emerald-600" />
            Nueva Receta
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">{error}</div>
          )}

          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Emoji</label>
              <input
                value={imageEmoji}
                onChange={(e) => setImageEmoji(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xl text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                maxLength={4}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {RECIPE_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre de la receta *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Tortilla de patatas"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción de la receta…"
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Comensales</label>
              <input
                type="number"
                min={1}
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tiempo (min)</label>
              <input
                type="number"
                min={1}
                value={prepTimeMin}
                onChange={(e) => setPrepTimeMin(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              <Tag className="w-3.5 h-3.5 inline mr-1" />
              Etiquetas (separadas por coma)
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="rápida, vegetariana, sin gluten…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-600">Ingredientes *</label>
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center gap-1 text-xs text-emerald-700 font-semibold hover:text-emerald-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Añadir ingrediente
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl p-2">
                  <input
                    value={ing.name}
                    onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                    placeholder="Ingrediente"
                    className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(i, 'quantity', parseFloat(e.target.value) || 1)}
                    className="w-14 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                    className="border border-slate-200 rounded-lg px-1 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  >
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={ing.estimatedPrice}
                    onChange={(e) => updateIngredient(i, 'estimatedPrice', e.target.value)}
                    placeholder="€"
                    className="w-14 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                  <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ing.isOptional}
                      onChange={(e) => updateIngredient(i, 'isOptional', e.target.checked)}
                      className="rounded"
                    />
                    Opt.
                  </label>
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(i)}
                      className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 transition-colors"
            >
              {loading ? 'Guardando…' : 'Crear Receta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Recipe Card ───────────────────────────────────────────────────────────────

interface RecipeCardProps {
  recipe: Recipe;
  onAddToList: (recipe: Recipe, servings: number) => Promise<void>;
  onDelete: (id: string) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onAddToList, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [servings, setServings] = useState(recipe.servings);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    await onAddToList(recipe, servings);
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const totalCost = recipe.ingredients.reduce(
    (sum, ing) => sum + (ing.estimatedPrice ?? 0) * ing.quantity * (servings / recipe.servings),
    0,
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs transition-shadow hover:shadow-md">
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="text-3xl">{recipe.imageEmoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 truncate">{recipe.name}</h3>
          {recipe.description && (
            <p className="text-xs text-slate-500 truncate mt-0.5">{recipe.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              {recipe.prepTimeMin} min
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Users className="w-3.5 h-3.5" />
              {recipe.servings} pers.
            </span>
            <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold">
              {recipe.ingredients.length} ingredientes
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(recipe.id); }}
            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tags */}
      {recipe.tags && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {recipe.tags.split(',').map((tag) => tag.trim()).filter(Boolean).map((tag) => (
            <span key={tag} className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Expanded ingredients */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-3">
          <div className="space-y-1.5">
            {recipe.ingredients.map((ing) => (
              <div key={ing.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 flex items-center gap-1.5">
                  {ing.isOptional && (
                    <span className="text-[10px] text-slate-400 border border-slate-200 px-1.5 rounded-full">opc.</span>
                  )}
                  {ing.name}
                </span>
                <span className="text-slate-500 text-xs">
                  {(ing.quantity * (servings / recipe.servings)).toFixed(1)} {ing.unit}
                  {ing.estimatedPrice && (
                    <span className="ml-1.5 text-emerald-600 font-medium">
                      ~{(ing.estimatedPrice * ing.quantity * (servings / recipe.servings)).toFixed(2)}€
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Add to list controls */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 font-medium">Comensales:</label>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  className="px-2 py-1 text-slate-600 hover:bg-slate-100 cursor-pointer font-bold text-sm"
                >−</button>
                <span className="px-2 text-sm font-bold text-slate-800">{servings}</span>
                <button
                  type="button"
                  onClick={() => setServings((s) => s + 1)}
                  className="px-2 py-1 text-slate-600 hover:bg-slate-100 cursor-pointer font-bold text-sm"
                >+</button>
              </div>
            </div>
            {totalCost > 0 && (
              <span className="text-xs text-slate-500 flex-1">
                ~{totalCost.toFixed(2)}€ total
              </span>
            )}
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all ${
                added
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              } disabled:opacity-50`}
            >
              <ShoppingCart className="w-4 h-4" />
              {added ? '¡Añadido!' : adding ? 'Añadiendo…' : 'Añadir a lista'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── RecipesView ───────────────────────────────────────────────────────────────

export const RecipesView: React.FC<RecipesViewProps> = ({ activeList, onIngredientAdded }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<RecipeCategory>('all');
  const [showCreate, setShowCreate] = useState(false);

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getRecipes({ search: search || undefined, category: category === 'all' ? undefined : category });
      setRecipes(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    const timer = setTimeout(loadRecipes, 300);
    return () => clearTimeout(timer);
  }, [loadRecipes]);

  const handleAddToList = async (recipe: Recipe, servings: number) => {
    await api.addRecipeToList(recipe.id, { listId: activeList.id, servings });
    onIngredientAdded();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta receta?')) return;
    await api.deleteRecipe(id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  const handleCreated = (recipe: Recipe) => {
    setRecipes((prev) => [recipe, ...prev]);
    setShowCreate(false);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-emerald-600" />
            Mis Recetas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Añadiendo a: <span className="font-semibold">{activeList.emoji} {activeList.name}</span>
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva receta
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar receta o ingrediente…"
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {RECIPE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              category === cat.id
                ? 'bg-emerald-700 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Recipe list */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <ChefHat className="w-10 h-10 mx-auto mb-3 opacity-30 animate-pulse" />
          <p>Cargando recetas…</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-semibold text-slate-500">No hay recetas todavía</p>
          <p className="text-sm mt-1">Crea tu primera receta o pídele ideas a AceitunAI 🫒</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-emerald-700"
          >
            Crear receta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onAddToList={handleAddToList}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateRecipeModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  );
};
