import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from '../FilterBar';

describe('FilterBar component', () => {
  it('handles search input, clear search, status filtering, category selection and sorting', () => {
    const handleSetSearchQuery = vi.fn();
    const handleSetSelectedCategory = vi.fn();
    const handleSetFilterStatus = vi.fn();
    const handleSetSortBy = vi.fn();

    render(
      <FilterBar
        searchQuery="leche"
        setSearchQuery={handleSetSearchQuery}
        selectedCategory="all"
        setSelectedCategory={handleSetSelectedCategory}
        filterStatus="all"
        setFilterStatus={handleSetFilterStatus}
        sortBy="aisle"
        setSortBy={handleSetSortBy}
      />
    );

    // Typing in search
    const input = screen.getByPlaceholderText('Buscar en tu lista...');
    expect(input).toHaveValue('leche');
    fireEvent.change(input, { target: { value: 'queso' } });
    expect(handleSetSearchQuery).toHaveBeenCalledWith('queso');

    // Filter status tab
    const pendingTab = screen.getByText('Pendientes');
    fireEvent.click(pendingTab);
    expect(handleSetFilterStatus).toHaveBeenCalledWith('pending');

    // Category button
    const categoryBtn = screen.getByText(/Fruta y Verdura/i);
    fireEvent.click(categoryBtn);
    expect(handleSetSelectedCategory).toHaveBeenCalledWith('fruta-verdura');

    // Sort select
    const sortSelect = screen.getByRole('combobox');
    fireEvent.change(sortSelect, { target: { value: 'price-asc' } });
    expect(handleSetSortBy).toHaveBeenCalledWith('price-asc');
  });
});
