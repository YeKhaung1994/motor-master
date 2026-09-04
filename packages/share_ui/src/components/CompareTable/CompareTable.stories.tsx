import type { Meta, StoryObj } from '@storybook/react';
import { CompareTable } from '.';

const meta: Meta<typeof CompareTable> = { title: 'Domain/CompareTable', component: CompareTable };
export default meta;
type Story = StoryObj<typeof CompareTable>;

export const ThreeBikes: Story = {
  args: {
    columns: [
      { id: 4, title: 'MT-07', brand: 'Yamaha', class: 'Naked' },
      { id: 6, title: 'Z900', brand: 'Kawasaki', class: 'Naked' },
      { id: 10, title: 'Trident 660', brand: 'Triumph', class: 'Naked' },
    ],
    winners: { DisplacementCc: 6, PowerHp: 6, TorqueNm: 6, KerbWeightKg: 4, PriceUsd: 10 },
    groups: [
      {
        title: 'Engine',
        rows: [
          { field: 'DisplacementCc', label: 'Displacement', values: ['689 cc', '948 cc', '660 cc'] },
          { field: 'PowerHp', label: 'Power', values: ['73 hp', '125 hp', '81 hp'] },
          { field: 'TorqueNm', label: 'Torque', values: ['67 Nm', '98 Nm', '64 Nm'] },
        ],
      },
      {
        title: 'Chassis',
        rows: [
          { field: 'KerbWeightKg', label: 'Kerb weight', values: ['184 kg', '212 kg', '190 kg'] },
          { field: 'SeatHeightMm', label: 'Seat height', values: ['805 mm', '820 mm', '805 mm'] },
        ],
      },
      {
        title: 'Price',
        rows: [{ field: 'PriceUsd', label: 'MSRP', values: ['$8,599', '$9,999', '$8,595'] }],
      },
    ],
  },
};

export const TwoBikes: Story = {
  args: {
    columns: [
      { id: 7, title: 'Ninja 400', brand: 'Kawasaki', class: 'Sport' },
      { id: 11, title: '390 Duke', brand: 'KTM', class: 'Naked' },
    ],
    winners: { PowerHp: 7, KerbWeightKg: 11, PriceUsd: 7 },
    groups: [
      {
        title: 'Engine',
        rows: [{ field: 'PowerHp', label: 'Power', values: ['45 hp', '45 hp'] }],
      },
      {
        title: 'Chassis',
        rows: [{ field: 'KerbWeightKg', label: 'Kerb weight', values: ['168 kg', '165 kg'] }],
      },
    ],
  },
};
