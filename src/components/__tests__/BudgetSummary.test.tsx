import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BudgetSummary } from '../BudgetSummary';

describe('BudgetSummary component', () => {
  const mockStats = {
    totalItems: 4,
    listItemsCount: 3,
    cartItemsCount: 1,
    totalEstimated: 12.50,
    listEstimated: 10.00,
    cartEstimated: 2.50,
    progressPercentage: 25,
  };

  it('renders budget numbers and item counts properly', () => {
    render(
      <BudgetSummary
        stats={mockStats}
        listName="Compra Semanal"
        onGoToCart={vi.fn()}
        onMoveAllToCart={vi.fn()}
      />
    );

    expect(screen.getByText('Lista: Compra Semanal')).toBeInTheDocument();
    expect(screen.getByText('1 de 4 en el carrito')).toBeInTheDocument();
    expect(screen.getByText('2.50')).toBeInTheDocument();
    expect(screen.getByText('12.50')).toBeInTheDocument();
  });

  it('triggers navigation and action handlers', () => {
    const handleGoToCart = vi.fn();
    const handleMoveAll = vi.fn();

    render(
      <BudgetSummary
        stats={mockStats}
        listName="Compra Semanal"
        onGoToCart={handleGoToCart}
        onMoveAllToCart={handleMoveAll}
      />
    );

    const viewCartBtn = screen.getByText('Ver Carrito');
    fireEvent.click(viewCartBtn);
    expect(handleGoToCart).toHaveBeenCalled();

    const moveAllBtn = screen.getByText('Meter todo al carro');
    fireEvent.click(moveAllBtn);
    expect(handleMoveAll).toHaveBeenCalled();
  });
});
