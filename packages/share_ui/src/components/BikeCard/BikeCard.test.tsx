import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BikeCard } from '.';
import type { BikeCardData } from '.';

const bike: BikeCardData = {
  id: 4,
  slug: 'yamaha-mt-07',
  name: 'MT-07',
  brand: 'Yamaha',
  class: 'Naked',
  cc: 689,
  hp: 73,
  kg: 184,
  priceUsd: 8599,
  imageUrl: null,
};

describe('BikeCard', () => {
  it('shows the headline figures and a formatted price', () => {
    render(<BikeCard bike={bike} />);

    expect(screen.getByRole('heading', { name: 'MT-07' })).toBeInTheDocument();
    expect(screen.getByText('Yamaha')).toBeInTheDocument();
    expect(screen.getByText('Naked')).toBeInTheDocument();
    expect(screen.getByText('689')).toBeInTheDocument();
    expect(screen.getByText('$8,599')).toBeInTheDocument();
  });

  it('links to the full spec sheet', () => {
    render(<BikeCard bike={bike} />);
    expect(screen.getByRole('link', { name: 'Full specs' })).toHaveAttribute(
      'href',
      '/bikes/yamaha-mt-07',
    );
  });

  it('toggles compare and swaps the label once added', async () => {
    const onToggleCompare = vi.fn();
    const { rerender } = render(<BikeCard bike={bike} onToggleCompare={onToggleCompare} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add to compare' }));
    expect(onToggleCompare).toHaveBeenCalledWith(bike);

    rerender(<BikeCard bike={bike} selected onToggleCompare={onToggleCompare} />);
    expect(screen.getByRole('button', { name: 'Added' })).toBeInTheDocument();
  });

  it('blocks compare when the tray is full and the bike is not in it', () => {
    render(<BikeCard bike={bike} compareDisabled />);
    expect(screen.getByRole('button', { name: 'Add to compare' })).toBeDisabled();
  });
});
