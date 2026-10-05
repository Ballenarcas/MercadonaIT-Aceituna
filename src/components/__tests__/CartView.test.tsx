import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartView } from '../CartView';
import { getCategoryById } from '../../data/categories';
import type { ShoppingItem } from '../../types';

describe('CartView component', () => {
  const sampleCartItems: ShoppingItem[] = [
    {
      id: 'item_1',
      listId: 'default',
      name: 'Leche Desnatada',
      categoryId: 'lacteos-huevos',
      brand: 'Hacendado',
      quantity: 2,
      unit: 'litro',
      estimatedPrice: 0.90,
      completed: true,
      inCart: true,
      priority: 'media',
      createdAt: 100,
    },
  ];

  const groupedCart = [
    {
      category: getCategoryById('lacteos-huevos'),
      items: sampleCartItems,
    },
  ];

  it('renders cart summary, items, and handles emptying cart and navigating back', () => {
    const handleClearCart = vi.fn();
    const handleBack = vi.fn();
    const handleShare = vi.fn();

    render(
      <CartView
        cartItems={sampleCartItems}
        groupedCartItems={groupedCart}
        cartEstimated={1.80}
        totalEstimated={10.00}
        listName="Compra Semanal"
        onToggleCart={vi.fn()}
        onUpdateItem={vi.fn()}
        onDeleteItem={vi.fn()}
        onClearCart={handleClearCart}
        onBackToList={handleBack}
        onOpenShare={handleShare}
      />
    );

    expect(screen.getByText('1 artículo en el carro')).toBeInTheDocument();
    expect(screen.getByText('1.80')).toBeInTheDocument();
    expect(screen.getByText('Leche Desnatada')).toBeInTheDocument();

    // Back to list
    fireEvent.click(screen.getByText('Volver a la lista de pendientes'));
    expect(handleBack).toHaveBeenCalled();

    // Share cart
    fireEvent.click(screen.getByText('Compartir Carro'));
    expect(handleShare).toHaveBeenCalled();

    // Clear cart
    fireEvent.click(screen.getByText('Vaciar Carrito'));
    expect(handleClearCart).toHaveBeenCalled();
  });

  it('renders empty cart view when no items are in cart', () => {
    render(
      <CartView
        cartItems={[]}
        groupedCartItems={[]}
        cartEstimated={0}
        totalEstimated={0}
        listName="Compra Semanal"
        onToggleCart={vi.fn()}
        onUpdateItem={vi.fn()}
        onDeleteItem={vi.fn()}
        onClearCart={vi.fn()}
        onBackToList={vi.fn()}
        onOpenShare={vi.fn()}
      />
    );

    expect(screen.getByText('Tu carrito está vacío todavía')).toBeInTheDocument();
  });
});
