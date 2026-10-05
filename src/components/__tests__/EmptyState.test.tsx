import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('EmptyState component', () => {
  it('renders default empty state when not filtered', () => {
    const handleOpenCatalog = vi.fn();
    render(
      <EmptyState
        onOpenCatalog={handleOpenCatalog}
        isFiltered={false}
        onClearFilter={vi.fn()}
      />
    );

    expect(screen.getByText('Tu lista está vacía')).toBeInTheDocument();
    const btn = screen.getByText('Explorar catálogo frecuente');
    fireEvent.click(btn);
    expect(handleOpenCatalog).toHaveBeenCalled();
  });

  it('renders filtered empty state when isFiltered is true', () => {
    const handleClearFilter = vi.fn();
    render(
      <EmptyState
        onOpenCatalog={vi.fn()}
        isFiltered={true}
        onClearFilter={handleClearFilter}
      />
    );

    expect(screen.getByText('No hay productos con este filtro')).toBeInTheDocument();
    const btn = screen.getByText('Limpiar filtros');
    fireEvent.click(btn);
    expect(handleClearFilter).toHaveBeenCalled();
  });
});
