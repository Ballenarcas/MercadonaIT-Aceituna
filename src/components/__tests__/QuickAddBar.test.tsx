import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickAddBar } from '../QuickAddBar';

describe('QuickAddBar component', () => {
  it('submits a new item when typing and submitting', () => {
    const handleAddItem = vi.fn();
    render(<QuickAddBar onAddItem={handleAddItem} />);

    const input = screen.getByPlaceholderText(/¿Qué necesitas de Mercadona/i);
    fireEvent.change(input, { target: { value: 'Yogur Griego Hacendado' } });

    const submitBtn = screen.getByRole('button', { name: /Añadir/i });
    fireEvent.click(submitBtn);

    expect(handleAddItem).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Yogur Griego Hacendado',
        quantity: 1,
        unit: 'ud',
      })
    );
    expect(input).toHaveValue('');
  });

  it('expands details and sets custom price and notes', () => {
    const handleAddItem = vi.fn();
    render(<QuickAddBar onAddItem={handleAddItem} />);

    const toggleDetails = screen.getByText('Cantidad y precio');
    fireEvent.click(toggleDetails);

    expect(screen.getByText('Menos detalles')).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/¿Qué necesitas de Mercadona/i);
    fireEvent.change(input, { target: { value: 'Salchichas' } });

    const priceInput = screen.getByPlaceholderText('ej. 1.85');
    fireEvent.change(priceInput, { target: { value: '2.50' } });

    const notesInput = screen.getByPlaceholderText(/Mirar fecha/i);
    fireEvent.change(notesInput, { target: { value: 'Pack de 4' } });

    const submitBtn = screen.getByRole('button', { name: /Añadir/i });
    fireEvent.click(submitBtn);

    expect(handleAddItem).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Salchichas',
        estimatedPrice: 2.50,
        notes: 'Pack de 4',
      })
    );
  });
});
