import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '.';

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  args: { children: 'Adventure' },
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const Solid: Story = {};
export const Outline: Story = { args: { variant: 'outline' } };
