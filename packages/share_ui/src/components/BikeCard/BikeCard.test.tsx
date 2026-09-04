import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BikeCard } from '.';
import type { BikeCardData } from '.';

const bike: BikeCardData = {
  id: 4,
  slug: 'honda-cbr500r',
  name: 'CBR500R',
  brand: 'Honda',
  class: 'Sport',
  cc: 471,
  hp: 47,
  kg: 192,
  price: { amount: 235800, currency: 'THB', text: 'THB 235,800', isApproximate: false },
  imageUrl: null,
};

describe('BikeCard', () => {
  it('shows the headline figures and a formatted price', () => {
    render(<BikeCard bike={bike} />);

    expect(screen.getByRole('heading', { name: 'CBR500R' })).toBeInTheDocument();
    expect(screen.getByText('Honda')).toBeInTheDocument();
    expect(screen.getByText('Sport')).toBeInTheDocument();
    expect(screen.getByText('471')).toBeInTheDocument();
    // The manufacturer's own wording, not a reformatted number.
    expect(screen.getByText('THB 235,800')).toBeInTheDocument();
  });

  it('links to the full spec sheet', () => {
    render(<BikeCard bike={bike} />);
    expect(screen.getByRole('link', { name: 'Full specs' })).toHaveAttribute(
      'href',
      '/bikes/honda-cbr500r',
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

  it('shows an em dash rather than a zero where no figure is published', () => {
    render(<BikeCard bike={{ ...bike, cc: null, hp: null, kg: null }} />);

    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('says so plainly when the price is not published', () => {
    render(<BikeCard bike={{ ...bike, price: null }} />);

    expect(screen.getByText('Price not published')).toBeInTheDocument();
  });

  it('keeps a qualified price exactly as the manufacturer states it', () => {
    render(
      <BikeCard
        bike={{
          ...bike,
          price: {
            amount: 181900,
            currency: 'THB',
            text: 'THB 181,900 / 183,900',
            isApproximate: false,
          },
        }}
      />,
    );

    expect(screen.getByText('THB 181,900 / 183,900')).toBeInTheDocument();
  });
});
