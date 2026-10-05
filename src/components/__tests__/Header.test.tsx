import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';

describe('Header component', () => {
  const mockLists = [
    {
      id: 'default',
      name: 'Compra Semanal',
      emoji: '🛒',
      color: '#059669',
      itemCount: 2,
      cartCount: 1,
      totalEstimated: 5.0,
      cartEstimated: 2.0,
      createdAt: 1000,
    },
    {
      id: 'list-barbacoa',
      name: 'Barbacoa',
      emoji: '🥩',
      color: '#ea580c',
      itemCount: 0,
      cartCount: 0,
      totalEstimated: 0,
      cartEstimated: 0,
      createdAt: 2000,
    }
  ];

  it('renders brand title and active list selector', () => {
    render(
      <Header
        onOpenCatalog={vi.fn()}
        onOpenShare={vi.fn()}
        onResetSample={vi.fn()}
        isBackendConnected={true}
        onRefreshBackend={vi.fn()}
        lists={mockLists}
        activeListId="default"
        onSelectList={vi.fn()}
        onOpenListsTab={vi.fn()}
      />
    );

    expect(screen.getByText('MERCADONA')).toBeInTheDocument();
    expect(screen.getByText('FastAPI')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Compra Semanal/)).toBeInTheDocument();
  });

  it('handles switching lists and action button clicks', () => {
    const handleSelectList = vi.fn();
    const handleOpenCatalog = vi.fn();
    const handleOpenShare = vi.fn();
    const handleResetSample = vi.fn();
    const handleRefreshBackend = vi.fn();

    render(
      <Header
        onOpenCatalog={handleOpenCatalog}
        onOpenShare={handleOpenShare}
        onResetSample={handleResetSample}
        isBackendConnected={false}
        onRefreshBackend={handleRefreshBackend}
        lists={mockLists}
        activeListId="default"
        onSelectList={handleSelectList}
        onOpenListsTab={vi.fn()}
      />
    );

    expect(screen.getByText('Modo Local')).toBeInTheDocument();

    // Select different list
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'list-barbacoa' } });
    expect(handleSelectList).toHaveBeenCalledWith('list-barbacoa');

    // Click catalog button
    const catalogBtn = screen.getByTitle('Abrir catálogo de productos frecuentes de Mercadona');
    fireEvent.click(catalogBtn);
    expect(handleOpenCatalog).toHaveBeenCalled();

    // Click share button
    const shareBtn = screen.getByTitle('Compartir lista y carrito (WhatsApp)');
    fireEvent.click(shareBtn);
    expect(handleOpenShare).toHaveBeenCalled();

    // Click reset sample button
    const resetBtn = screen.getByTitle('Restaurar ejemplos de prueba');
    fireEvent.click(resetBtn);
    expect(handleResetSample).toHaveBeenCalled();
  });
});
