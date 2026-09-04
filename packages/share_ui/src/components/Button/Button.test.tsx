import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '.';

describe('Button', () => {
  it('renders the outcome as its label and fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Add to compare</Button>);

    const button = screen.getByRole('button', { name: 'Add to compare' });
    await userEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute('type', 'button');
  });

  it('does not fire when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Compare 1 bike
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Compare 1 bike' });
    expect(button).toBeDisabled();

    // The disabled style sets `pointer-events: none`, so bypass user-event's
    // pointer guard to prove the handler itself never runs.
    await userEvent.click(button, { pointerEventsCheck: 0 });
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders a link when given an href', () => {
    render(<Button href="/bikes/yamaha-mt-07">Full specs</Button>);
    expect(screen.getByRole('link', { name: 'Full specs' })).toHaveAttribute(
      'href',
      '/bikes/yamaha-mt-07',
    );
  });
});
