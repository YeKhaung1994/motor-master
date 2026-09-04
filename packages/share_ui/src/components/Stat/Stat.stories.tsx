import type { Meta, StoryObj } from '@storybook/react';
import { Stat } from '.';

const meta: Meta<typeof Stat> = {
  title: 'Primitives/Stat',
  component: Stat,
  args: { value: 689, unit: 'cc', label: 'Engine' },
};
export default meta;
type Story = StoryObj<typeof Stat>;

export const Card: Story = { args: { size: 'sm' } };
export const Detail: Story = { args: { size: 'lg' } };
export const Winner: Story = { args: { size: 'lg', winner: true, value: 145, unit: 'hp', label: 'Power' } };
