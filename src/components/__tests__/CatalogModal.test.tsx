import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CatalogModal } from '../CatalogModal';

describe('CatalogModal component', () => {
  it('renders popular catalog items and adds item on click', () => {
    const handleAddProduct = vi.fn();
    const handleClose = vi.fn();

    render(
      <CatalogModal
        isOpen={true}
        onClose={handleClose}
        onAddProduct={handleAddProduct}
      />
    );

    expect(screen.getByText('Catálogo Frecuente Mercadona')).toBeInTheDocument();

    // Filter by search
    const searchInput = screen.getByPlaceholderText(/Buscar productos/i);
    fireEvent.change(searchInput, { target: { value: 'Guacamole' } });

    // Expect to find Guacamole in list
    expect(screen.getByText(/Guacamole fresco/i)).toBeInTheDocument();

    // Add item
    const addBtns = screen.getAllByRole('button', { name: /Añadir/i });
    fireEvent.click(addBtns[0]);

    expect(handleAddProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.stringContaining('Guacamole'),
      })
    );

    // Close
    const closeBtn = screen.getByText('Listo, volver a la lista');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <CatalogModal
        isOpen={false}
        onClose={vi.fn()}
        onAddProduct={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
