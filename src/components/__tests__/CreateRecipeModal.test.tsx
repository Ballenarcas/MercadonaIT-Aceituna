import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateRecipeModal from '../CreateRecipeModal';
import { api } from '../../services/api';

vi.mock('../../services/api', () => ({
  api: {
    createRecipe: vi.fn(),
  },
}));

describe('CreateRecipeModal component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <CreateRecipeModal
        isOpen={false}
        onClose={vi.fn()}
        onCreated={vi.fn()}
      />
    );
    expect(screen.queryByText('Crear nueva receta')).not.toBeInTheDocument();
  });

  it('renders modal fields when isOpen is true', () => {
    render(
      <CreateRecipeModal
        isOpen={true}
        onClose={vi.fn()}
        onCreated={vi.fn()}
      />
    );

    expect(screen.getByText('Crear nueva receta')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Tortilla de patatas/i)).toBeInTheDocument();
    expect(screen.getByText('Categoría')).toBeInTheDocument();
    expect(screen.getByText('Raciones')).toBeInTheDocument();
  });

  it('submits form and calls api.createRecipe and onCreated', async () => {
    const mockOnCreated = vi.fn();
    const mockOnClose = vi.fn();

    const createdRecipe = {
      id: 'recipe_new_1',
      name: 'Paella Valenciana',
      description: 'Arroz con conejo y verduras',
      category: 'comida',
      servings: 4,
      prepTimeMin: 45,
      imageEmoji: '🥘',
      tags: 'arroz,valencia',
      ingredients: [],
      createdAt: 1234567,
    };

    vi.mocked(api.createRecipe).mockResolvedValue(createdRecipe);

    render(
      <CreateRecipeModal
        isOpen={true}
        onClose={mockOnClose}
        onCreated={mockOnCreated}
      />
    );

    const nameInput = screen.getByPlaceholderText(/Tortilla de patatas/i);
    fireEvent.change(nameInput, { target: { value: 'Paella Valenciana' } });

    const submitBtn = screen.getByRole('button', { name: /Crear receta/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.createRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Paella Valenciana',
        })
      );
      expect(mockOnCreated).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
