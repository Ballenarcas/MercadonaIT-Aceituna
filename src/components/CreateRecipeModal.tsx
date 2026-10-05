import React, { useState, useEffect } from 'react';
import { ChefHat, Plus, Trash2, X } from 'lucide-react';
import type { Recipe, Unit } from '../types';
import { api } from '../services/api';

interface CreateRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (recipe: Recipe) => void;
  recipeToEdit?: Recipe | null;
  onUpdated?: (recipe: Recipe) => void;
}

const COMMON_EMOJIS = ['🍽️', '🍝', '🥘', '🍲', '🥗', '🍳', '🥩', '🐟', '🍰', '🥪', '🥣', '🌮'];

const UNITS: Unit[] = ['ud', 'kg', 'g', 'pack', 'litro', 'docena', 'bandeja'];

export const CreateRecipeModal: React.FC<CreateRecipeModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  recipeToEdit,
  onUpdated,
}) => {
  const [name, setName] = useState('');
  const [creator, setCreator] = useState('@mi_cocina');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('comida');
  const [servings, setServings] = useState(2);
  const [prepTimeMin, setPrepTimeMin] = useState(25);
  const [imageEmoji, setImageEmoji] = useState('🍽️');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [ingredients, setIngredients] = useState([
    { name: '', quantity: 1, unit: 'ud' as Unit },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = Boolean(recipeToEdit);

  useEffect(() => {
    if (recipeToEdit) {
      setName(recipeToEdit.name || '');
      setCreator((recipeToEdit as unknown as { creator?: string }).creator || '@mi_cocina');
      setDescription(recipeToEdit.description || '');
      setCategory(recipeToEdit.category || 'comida');
      setServings(recipeToEdit.servings || 2);
      setPrepTimeMin(recipeToEdit.prepTimeMin || 25);
      setImageEmoji(recipeToEdit.imageEmoji || '🍽️');
      setImageUrl((recipeToEdit as unknown as { image?: string }).image || '');
      setTags(recipeToEdit.tags || '');
      if (recipeToEdit.ingredients && recipeToEdit.ingredients.length > 0) {
        setIngredients(
          recipeToEdit.ingredients.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unit: i.unit as Unit,
          }))
        );
      } else {
        setIngredients([{ name: '', quantity: 1, unit: 'ud' }]);
      }
    } else {
      setName('');
      setCreator('@mi_cocina');
      setDescription('');
      setCategory('comida');
      setServings(2);
      setPrepTimeMin(25);
      setImageEmoji('🍽️');
      setImageUrl('');
      setTags('');
      setIngredients([{ name: '', quantity: 1, unit: 'ud' }]);
    }
    setError('');
  }, [recipeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddIngredient = () => {
    setIngredients((prev) => [...prev, { name: '', quantity: 1, unit: 'ud' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: string, value: unknown) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la receta es obligatorio');
      return;
    }

    const validIngredients = ingredients.filter((ing) => ing.name.trim().length > 0);

    setLoading(true);
    setError('');

    try {
      if (isEditing && recipeToEdit && onUpdated) {
        const updated = await api.updateRecipe(recipeToEdit.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          servings: Number(servings) || 2,
          prepTimeMin: Number(prepTimeMin) || 25,
          imageEmoji,
          tags: tags.trim(),
          ingredients: validIngredients.map((ing) => ({
            id: '',
            recipeId: recipeToEdit.id,
            name: ing.name.trim(),
            quantity: Number(ing.quantity) || 1,
            unit: ing.unit,
            categoryId: 'otros',
            isOptional: false,
          })),
        });

        const finalUpdated: Recipe = {
          ...recipeToEdit,
          ...updated,
          name: updated.name || name.trim(),
          description: updated.description || description.trim(),
          category: updated.category || category,
          servings: updated.servings || servings,
          prepTimeMin: updated.prepTimeMin || prepTimeMin,
          imageEmoji: updated.imageEmoji || imageEmoji,
          ingredients: updated.ingredients || validIngredients.map((ing, idx) => ({
            id: `ing_${idx}`,
            recipeId: recipeToEdit.id,
            name: ing.name.trim(),
            quantity: Number(ing.quantity) || 1,
            unit: ing.unit,
            categoryId: 'otros',
            isOptional: false,
          })),
        };

        onUpdated(finalUpdated);
        onClose();
      } else {
        const created = await api.createRecipe({
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          servings: Number(servings) || 2,
          prepTimeMin: Number(prepTimeMin) || 25,
          imageEmoji,
          tags: tags.trim(),
          ingredients: validIngredients.map((ing) => ({
            id: '',
            recipeId: '',
            name: ing.name.trim(),
            quantity: Number(ing.quantity) || 1,
            unit: ing.unit,
            categoryId: 'otros',
            isOptional: false,
          })),
        });

        const finalRecipe: Recipe = {
          ...created,
          name: created.name || name.trim(),
          description: created.description || description.trim(),
        };

        onCreated(finalRecipe);
        onClose();
      }
    } catch {
      // Offline fallback
      if (isEditing && recipeToEdit && onUpdated) {
        const localUpdated: Recipe = {
          ...recipeToEdit,
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          servings: Number(servings) || 2,
          prepTimeMin: Number(prepTimeMin) || 25,
          imageEmoji,
          tags: tags.trim(),
          ingredients: validIngredients.map((ing, i) => ({
            id: `ing_${i}`,
            recipeId: recipeToEdit.id,
            name: ing.name.trim(),
            quantity: Number(ing.quantity) || 1,
            unit: ing.unit,
            categoryId: 'otros',
            isOptional: false,
          })),
        };
        onUpdated(localUpdated);
        onClose();
      } else {
        const fallbackRecipe: Recipe = {
          id: `recipe_${Date.now()}`,
          name: name.trim(),
          description: description.trim() || 'Receta casera',
          category,
          servings: Number(servings) || 2,
          prepTimeMin: Number(prepTimeMin) || 25,
          imageEmoji,
          tags: tags.trim(),
          ingredients: validIngredients.map((ing, i) => ({
            id: `ing_${i}`,
            recipeId: `recipe_${Date.now()}`,
            name: ing.name.trim(),
            quantity: Number(ing.quantity) || 1,
            unit: ing.unit,
            categoryId: 'otros',
            isOptional: false,
          })),
          createdAt: Date.now(),
        };
        onCreated(fallbackRecipe);
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-green-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 text-[#00703c] rounded-lg">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {isEditing ? 'Editar receta' : 'Crear nueva receta'}
              </h2>
              <p className="text-xs text-gray-500">
                {isEditing
                  ? 'Modifica los ingredientes y detalles de tu receta'
                  : 'Comparte tu receta con la comunidad de Mercadona'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Nombre y Creador */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nombre de la receta *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Tortilla de patatas con cebolla"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#00703c] focus:ring-1 focus:ring-[#00703c]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Autor (@usuario)
              </label>
              <input
                type="text"
                placeholder="@tu_usuario"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#00703c] focus:ring-1 focus:ring-[#00703c]"
              />
            </div>
          </div>

          {/* Categoría, Raciones, Tiempo, Emoji */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#00703c]"
              >
                <option value="comida">Comida</option>
                <option value="cena">Cena</option>
                <option value="desayuno">Desayuno</option>
                <option value="postre">Postre</option>
                <option value="snack">Snack</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Raciones</label>
              <input
                type="number"
                min="1"
                max="20"
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#00703c]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tiempo (min)</label>
              <input
                type="number"
                min="5"
                max="300"
                value={prepTimeMin}
                onChange={(e) => setPrepTimeMin(parseInt(e.target.value) || 15)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#00703c]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Emoji</label>
              <select
                value={imageEmoji}
                onChange={(e) => setImageEmoji(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-lg focus:outline-none focus:border-[#00703c]"
              >
                {COMMON_EMOJIS.map((em) => (
                  <option key={em} value={em}>
                    {em}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Descripción</label>
            <textarea
              rows={2}
              placeholder="Explica brevemente los pasos o el toque especial de tu receta..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#00703c] resize-none"
            />
          </div>

          {/* Imagen URL y Etiquetas opcionales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                URL de imagen (opcional)
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#00703c]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Etiquetas / Tags (opcional)
              </label>
              <input
                type="text"
                placeholder="ej: pasta, facil, tradicional"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#00703c]"
              />
            </div>
          </div>

          {/* Ingredientes */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700">
                Ingredientes necesarios ({ingredients.length})
              </label>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="text-xs font-semibold text-[#00703c] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir ingrediente
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ingrediente (ej: Arroz redondo)"
                    value={ing.name}
                    onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#00703c]"
                  />
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={ing.quantity}
                    onChange={(e) =>
                      handleIngredientChange(idx, 'quantity', parseFloat(e.target.value) || 1)
                    }
                    className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#00703c]"
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                    className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#00703c]"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Botones */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition-colors text-sm cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#00703c] text-white font-semibold rounded-lg hover:bg-[#005a30] transition-colors text-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loading
                ? 'Guardando...'
                : isEditing
                ? 'Guardar cambios'
                : 'Crear receta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRecipeModal;
