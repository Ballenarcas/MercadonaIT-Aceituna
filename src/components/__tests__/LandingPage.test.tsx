import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LandingPage } from '../LandingPage';

describe('LandingPage', () => {
  it('shows the Mercadona navigation and opens MercadITo', () => {
    const onOpenMercadito = vi.fn();
    render(<LandingPage onOpenMercadito={onOpenMercadito} />);

    expect(screen.getByRole('link', { name: 'Mercadona, inicio' })).toBeInTheDocument();
    expect(screen.getByText('Conócenos')).toBeInTheDocument();
    expect(screen.getByText('Supermercados')).toBeInTheDocument();
    expect(screen.getByText('Trabaja con nosotros')).toBeInTheDocument();
    expect(screen.getByText('Atención al cliente')).toBeInTheDocument();
    expect(screen.getByLabelText('Idioma seleccionado: Español')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'MercadITo' }));
    expect(onOpenMercadito).toHaveBeenCalledOnce();
  });

  it('opens MercadITo when a postal code is submitted', () => {
    const onOpenMercadito = vi.fn();
    render(<LandingPage onOpenMercadito={onOpenMercadito} />);

    fireEvent.change(screen.getByLabelText('Código postal'), {
      target: { value: '28001' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'ENTRAR' }).closest('form')!);

    expect(onOpenMercadito).toHaveBeenCalledOnce();
  });
});
