import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareModal } from '../ShareModal';

import type { ShoppingItem } from '../../types';

describe('ShareModal component', () => {
  const sampleText = '🛒 *COMPRA MERCADONA*\n⬜ Manzanas (1 kg)\n💰 Total: 10.00 €';
  const mockItems: ShoppingItem[] = [];

  it('renders modal content and triggers clipboard copying and closing', async () => {
    const handleClose = vi.fn();

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(
      <ShareModal
        isOpen={true}
        onClose={handleClose}
        shareText={sampleText}
        items={mockItems as any}
      />
    );

    expect(screen.getByText('Compartir Lista de Compra')).toBeInTheDocument();
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe(sampleText);

    // Copy to clipboard
    const copyBtn = screen.getByText('Copiar al portapapeles');
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(sampleText);

    // Close button
    const closeBtn = screen.getByText('Cerrar');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('does not render anything when isOpen is false', () => {
    const { container } = render(
      <ShareModal
        isOpen={false}
        onClose={vi.fn()}
        shareText={sampleText}
        items={mockItems as any}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
