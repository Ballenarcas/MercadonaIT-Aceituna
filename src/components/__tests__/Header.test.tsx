import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '../Header';

describe('Header component', () => {
  it('renders the Mercadona brand and navigation links', () => {
    render(<Header />);

    expect(screen.getByText('MERCADONA')).toBeInTheDocument();
    expect(screen.getByText('Compra online')).toBeInTheDocument();
    expect(screen.getByText('Actualidad')).toBeInTheDocument();
    expect(screen.getByText('Atención al Cliente')).toBeInTheDocument();
  });
});
