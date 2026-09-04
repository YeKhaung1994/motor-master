import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompareTable } from '.';

const columns = [
  { id: 4, title: 'MT-07', brand: 'Yamaha', class: 'Naked' },
  { id: 6, title: 'Z900', brand: 'Kawasaki', class: 'Naked' },
];

const groups = [
  {
    title: 'Engine',
    rows: [{ field: 'PowerHp', label: 'Power', values: ['73 hp', '125 hp'] }],
  },
  {
    title: 'Chassis',
    rows: [
      { field: 'KerbWeightKg', label: 'Kerb weight', values: ['184 kg', '212 kg'] },
      { field: 'Brakes', label: 'Brakes', values: [null, null] },
    ],
  },
];

describe('CompareTable', () => {
  it('marks only the winning cell in each row', () => {
    render(
      <CompareTable
        columns={columns}
        groups={groups}
        winners={{ PowerHp: 6, KerbWeightKg: 4 }}
      />,
    );

    const winningPower = screen.getByText('125 hp');
    const losingPower = screen.getByText('73 hp');
    expect(winningPower.className).toMatch(/winner/);
    expect(losingPower.className).not.toMatch(/winner/);

    // Lowest kerb weight wins, so the other column takes the red this time.
    expect(screen.getByText('184 kg').className).toMatch(/winner/);
    expect(screen.getByText('212 kg').className).not.toMatch(/winner/);
  });

  it('never marks a blank cell as a winner and renders it as an em dash', () => {
    render(
      <CompareTable columns={columns} groups={groups} winners={{ Brakes: 4 }} />,
    );

    const blanks = screen.getAllByText('—');
    expect(blanks).toHaveLength(2);
    blanks.forEach((cell) => expect(cell.className).not.toMatch(/winner/));
  });

  it('labels each column with the model and its brand and class', () => {
    render(<CompareTable columns={columns} groups={groups} winners={{}} />);

    expect(screen.getByText('MT-07')).toBeInTheDocument();
    expect(screen.getByText('Yamaha · Naked')).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Power' })).toBeInTheDocument();
  });
});
