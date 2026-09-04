import type { Meta, StoryObj } from '@storybook/react';
import { SpecTable } from '.';

const meta: Meta<typeof SpecTable> = { title: 'Domain/SpecTable', component: SpecTable };
export default meta;
type Story = StoryObj<typeof SpecTable>;

export const SingleBike: Story = {
  args: {
    columns: [{ id: 4, title: 'MT-07', meta: 'Yamaha · Naked' }],
    groups: [
      {
        title: 'Engine',
        rows: [
          { field: 'DisplacementCc', label: 'Displacement', values: ['689 cc'] },
          { field: 'PowerHp', label: 'Power', values: ['73 hp'] },
          { field: 'TorqueNm', label: 'Torque', values: ['67 Nm'] },
          { field: 'Transmission', label: 'Transmission', values: [null] },
        ],
      },
      {
        title: 'Chassis',
        rows: [
          { field: 'KerbWeightKg', label: 'Kerb weight', values: ['184 kg'] },
          { field: 'SeatHeightMm', label: 'Seat height', values: ['805 mm'] },
          { field: 'FuelTankL', label: 'Fuel tank', values: ['14 L'] },
        ],
      },
    ],
  },
};

/** Rows the brand JSON import has not filled in yet render as an em dash. */
export const WithMissingValues: Story = {
  args: {
    columns: [{ id: 1, title: 'CB650R', meta: 'Honda · Naked' }],
    groups: [
      {
        title: 'Running gear',
        rows: [
          { field: 'FrontSuspension', label: 'Front suspension', values: [null] },
          { field: 'Brakes', label: 'Brakes', values: [null] },
          { field: 'Tyres', label: 'Tyres', values: [null] },
        ],
      },
    ],
  },
};
