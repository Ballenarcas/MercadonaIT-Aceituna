import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ListsView } from '../ListsView';
import type { ShoppingList } from '../../types';

describe('ListsView component', () => {
  const mockLists: ShoppingList[] = [
    {
      id: 'default',
      name: 'Compra Semanal',
      emoji: '🛒',
      color: '#059669',
      itemCount: 4,
      cartCount: 1,
      totalEstimated: 12.0,
      cartEstimated: 3.0,
      createdAt: 100,
    },
    {
      id: 'list-2',
      name: 'Barbacoa',
      emoji: '🥩',
      color: '#ea580c',
      itemCount: 2,
      cartCount: 0,
      totalEstimated: 25.0,
      cartEstimated: 0,
      createdAt: 200,
    },
  ];

  it('renders lists grid and handles creating a new list', () => {
    const handleCreate = vi.fn();
    const handleSelect = vi.fn();
    const handleDelete = vi.fn();
    const handleGoShopping = vi.fn();

    render(
      <ListsView
        lists={mockLists}
        activeListId="default"
        onSelectList={handleSelect}
        onCreateList={handleCreate}
        onDeleteList={handleDelete}
        onGoToShopping={handleGoShopping}
      />
    );

    expect(screen.getByText('Compra Semanal')).toBeInTheDocument();
    expect(screen.getByText('Barbacoa')).toBeInTheDocument();
    expect(screen.getByText('Activa')).toBeInTheDocument();

    // Open create modal
    const openModalBtn = screen.getByText('Crear Nueva Lista');
    fireEvent.click(openModalBtn);

    expect(screen.getByText('Nueva Lista de la Compra')).toBeInTheDocument();
    const nameInput = screen.getByPlaceholderText(/Compra Quincenal/i);
    fireEvent.change(nameInput, { target: { value: 'Cena Amigos' } });

    const submitBtn = screen.getByText('Guardar Lista');
    fireEvent.click(submitBtn);

    expect(handleCreate).toHaveBeenCalledWith('Cena Amigos', expect.any(String), expect.any(String));
  });

  it('handles selecting and deleting a secondary list', () => {
    const handleSelect = vi.fn();
    const handleDelete = vi.fn();
    const handleGoShopping = vi.fn();

    render(
      <ListsView
        lists={mockLists}
        activeListId="default"
        onSelectList={handleSelect}
        onCreateList={vi.fn()}
        onDeleteList={handleDelete}
        onGoToShopping={handleGoShopping}
      />
    );

    // Select secondary list
    const selectBtn = screen.getByText('Seleccionar y abrir lista');
    fireEvent.click(selectBtn);
    expect(handleSelect).toHaveBeenCalledWith('list-2');
    expect(handleGoShopping).toHaveBeenCalled();

    // Delete list button (second list)
    const deleteBtns = screen.getAllByTitle('Eliminar lista');
    fireEvent.click(deleteBtns[1]);
    expect(handleDelete).toHaveBeenCalledWith('list-2');
  });
});
