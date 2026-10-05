import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemCard } from '../ItemCard';
import type { ShoppingItem } from '../../types';

describe('ItemCard component', () => {
  const sampleItem: ShoppingItem = {
    id: 'item_1',
    listId: 'default',
    name: 'Hummus Clásico Hacendado',
    categoryId: 'aperitivos-dulces',
    brand: 'Hacendado',
    quantity: 2,
    unit: 'ud',
    estimatedPrice: 1.35,
    notes: 'Tarrina 240g',
    completed: false,
    inCart: false,
    priority: 'alta',
    createdAt: 100,
  };

  it('renders item details, brand badge, and calculated total price in list mode', () => {
    render(
      <ItemCard
        item={sampleItem}
        mode="list"
        onToggleCart={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Hummus Clásico Hacendado')).toBeInTheDocument();
    expect(screen.getByText('Hacendado')).toBeInTheDocument();
    expect(screen.getByText('Urgente')).toBeInTheDocument();
    expect(screen.getByText('2.70€')).toBeInTheDocument();
    expect(screen.getByText('Al Carrito')).toBeInTheDocument();
  });

  it('handles quantity increment, decrement, cart toggle, and delete', () => {
    const handleToggleCart = vi.fn();
    const handleUpdate = vi.fn();
    const handleDelete = vi.fn();

    render(
      <ItemCard
        item={sampleItem}
        mode="list"
        onToggleCart={handleToggleCart}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    );

    // Toggle cart
    fireEvent.click(screen.getByText('Al Carrito'));
    expect(handleToggleCart).toHaveBeenCalledWith('item_1');

    // Increment
    const plusButtons = screen.getAllByRole('button');
    const plusBtn = plusButtons.find(b => b.querySelector('svg.lucide-plus'));
    if (plusBtn) fireEvent.click(plusBtn);
    expect(handleUpdate).toHaveBeenCalledWith('item_1', { quantity: 3 });

    // Decrement
    const minusBtn = plusButtons.find(b => b.querySelector('svg.lucide-minus'));
    if (minusBtn) fireEvent.click(minusBtn);
    expect(handleUpdate).toHaveBeenCalledWith('item_1', { quantity: 1 });

    // Delete
    const deleteBtn = screen.getByTitle('Eliminar producto');
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith('item_1');
  });

  it('renders correctly in cart mode', () => {
    const inCartItem: ShoppingItem = {
      ...sampleItem,
      inCart: true,
      completed: true,
    };

    render(
      <ItemCard
        item={inCartItem}
        mode="cart"
        onToggleCart={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('En carro')).toBeInTheDocument();
    expect(screen.getByText('A la lista')).toBeInTheDocument();
  });
});
