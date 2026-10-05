import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatBot } from '../ChatBot';
import { api } from '../../services/api';
import type { ShoppingList } from '../../types';

vi.mock('../../services/api', () => ({
  api: {
    sendChatMessage: vi.fn(),
    createItemsBatch: vi.fn(),
  },
}));

const mockActiveList: ShoppingList = {
  id: 'default',
  name: 'Compra Principal',
  emoji: '🛒',
  color: '#059669',
  itemCount: 2,
  cartCount: 0,
  totalEstimated: 10,
  cartEstimated: 0,
  createdAt: 1000,
};

describe('ChatBot component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders floating button and opens chat window on click', () => {
    render(<ChatBot activeList={mockActiveList} onIngredientAdded={vi.fn()} />);

    const openBtn = screen.getByTitle('mercadITo - Asistente de cocina');
    expect(openBtn).toBeInTheDocument();

    fireEvent.click(openBtn);
    expect(screen.getAllByText('mercadITo').length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/Escribe ingredientes o una receta/i)).toBeInTheDocument();
  });

  it('shows missing ingredients with checkboxes and adds checked items to cart', async () => {
    const onIngredientAdded = vi.fn();

    vi.mocked(api.sendChatMessage).mockResolvedValueOnce({
      reply: 'Aquí tienes los ingredientes que faltan:',
      addedIngredients: [],
      suggestedRecipes: [],
      recipeName: 'Macarrones a la boloñesa',
      missingIngredients: [
        {
          name: 'Carne picada mixta',
          quantity: 1,
          unit: 'ud',
          estimatedPrice: 3.25,
          categoryId: 'carne',
        },
        {
          name: 'Tomate frito artesana',
          quantity: 1,
          unit: 'ud',
          estimatedPrice: 1.70,
          categoryId: 'despensa-conservas',
        }
      ],
    });

    vi.mocked(api.createItemsBatch).mockResolvedValueOnce([] as any);

    render(<ChatBot activeList={mockActiveList} onIngredientAdded={onIngredientAdded} />);

    // Open chat
    fireEvent.click(screen.getByTitle('mercadITo - Asistente de cocina'));

    // Type recipe
    const input = screen.getByPlaceholderText(/Escribe ingredientes o una receta/i);
    fireEvent.change(input, { target: { value: 'Macarrones a la boloñesa' } });

    const sendBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(sendBtn);

    // Wait for message and missing ingredients checklist
    await waitFor(() => {
      expect(screen.getByText(/Ingredientes faltantes/i)).toBeInTheDocument();
      expect(screen.getByText('Carne picada mixta')).toBeInTheDocument();
      expect(screen.getByText('Tomate frito artesana')).toBeInTheDocument();
    });

    // Both checkboxes are present
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(2);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();

    // Toggle second checkbox off
    fireEvent.click(checkboxes[1]);
    expect(checkboxes[1]).not.toBeChecked();

    // Both buttons should be present
    expect(screen.getByRole('button', { name: /Añadir a la lista/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Añadir al carrito/i })).toBeInTheDocument();

    // Click "Añadir a la lista"
    const addToListBtn = screen.getByRole('button', { name: /Añadir a la lista/i });
    fireEvent.click(addToListBtn);

    await waitFor(() => {
      expect(api.createItemsBatch).toHaveBeenCalledWith(
        'default',
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Carne picada mixta',
            inCart: false,
          })
        ])
      );
      expect(onIngredientAdded).toHaveBeenCalled();
    });
  });

  it('adds checked missing ingredients directly to cart when clicking Añadir al carrito', async () => {
    const onIngredientAdded = vi.fn();

    vi.mocked(api.sendChatMessage).mockResolvedValueOnce({
      reply: 'Aquí tienes los ingredientes que faltan:',
      addedIngredients: [],
      suggestedRecipes: [],
      recipeName: 'Tortilla de patatas',
      missingIngredients: [
        {
          name: 'Huevos Camperos',
          quantity: 6,
          unit: 'ud',
          estimatedPrice: 1.85,
          categoryId: 'huevos-lacteos',
        }
      ],
    });

    vi.mocked(api.createItemsBatch).mockResolvedValueOnce([] as any);

    render(<ChatBot activeList={mockActiveList} onIngredientAdded={onIngredientAdded} />);

    fireEvent.click(screen.getByTitle('mercadITo - Asistente de cocina'));

    const input = screen.getByPlaceholderText(/Escribe ingredientes o una receta/i);
    fireEvent.change(input, { target: { value: 'Tortilla de patatas' } });

    const sendBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('Huevos Camperos')).toBeInTheDocument();
    });

    const addToCartBtn = screen.getByRole('button', { name: /Añadir al carrito/i });
    fireEvent.click(addToCartBtn);

    await waitFor(() => {
      expect(api.createItemsBatch).toHaveBeenCalledWith(
        'default',
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Huevos Camperos',
            inCart: true,
          })
        ])
      );
      expect(onIngredientAdded).toHaveBeenCalled();
    });
  });

  it('displays suggested recipe chips when ingredients are sent', async () => {
    vi.mocked(api.sendChatMessage).mockResolvedValueOnce({
      reply: 'Puedes preparar estas recetas:',
      addedIngredients: [],
      suggestedRecipes: ['Arroz a la cubana con huevo'],
      recipeSuggestions: [
        {
          id: 'recipe_2',
          name: 'Arroz a la cubana con huevo',
          imageEmoji: '🍳',
          matchScore: 80,
          matchedIngredients: ['arroz', 'huevo'],
          missingCount: 2,
        }
      ],
    });

    render(<ChatBot activeList={mockActiveList} onIngredientAdded={vi.fn()} />);

    fireEvent.click(screen.getByTitle('mercadITo - Asistente de cocina'));

    const input = screen.getByPlaceholderText(/Escribe ingredientes o una receta/i);
    fireEvent.change(input, { target: { value: 'Tengo arroz y huevos' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Arroz a la cubana con huevo')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });
  });
});
