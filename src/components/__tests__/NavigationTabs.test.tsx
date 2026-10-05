import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavigationTabs } from '../NavigationTabs';

describe('NavigationTabs component', () => {
  const mockList = {
    id: 'default',
    name: 'Compra Semanal',
    emoji: '🛒',
    color: '#059669',
    itemCount: 5,
    cartCount: 2,
    totalEstimated: 15.0,
    cartEstimated: 4.5,
    createdAt: 100,
  };

  it('renders all three tabs (lists, list, cart) and triggers tab switching', () => {
    const handleSetActiveTab = vi.fn();

    render(
      <NavigationTabs
        activeTab="list"
        setActiveTab={handleSetActiveTab}
        activeList={mockList}
        listItemsCount={3}
        cartItemsCount={2}
        cartEstimated={4.5}
        listsCount={2}
      />
    );

    expect(screen.getByText('Mis Listas')).toBeInTheDocument();
    expect(screen.getByText(/Compra Semanal/)).toBeInTheDocument();
    expect(screen.getByText('Carrito')).toBeInTheDocument();
    expect(screen.getByText('(4.50€)')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Mis Listas'));
    expect(handleSetActiveTab).toHaveBeenCalledWith('lists');

    fireEvent.click(screen.getByText('Carrito'));
    expect(handleSetActiveTab).toHaveBeenCalledWith('cart');
  });
});
