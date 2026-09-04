import type { Meta, StoryObj } from '@storybook/react';
import { KeyStats } from '.';

const meta: Meta<typeof KeyStats> = {
  title: 'Domain/KeyStats',
  component: KeyStats,
  args: {
    items: [
      { value: 689, unit: 'cc', label: 'Engine' },
      { value: 73, unit: 'hp', label: 'Power' },
      { value: 67, unit: 'Nm', label: 'Torque' },
      { value: 184, unit: 'kg', label: 'Kerb weight' },
    ],
  },
};
export default meta;
type Story = StoryObj<typeof KeyStats>;

export const Default: Story = {};
