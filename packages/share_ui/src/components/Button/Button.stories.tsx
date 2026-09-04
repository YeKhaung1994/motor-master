import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '.';

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  args: { children: 'Full specs' },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { variant: 'primary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Compare: Story = { args: { variant: 'compare', children: 'Add to compare' } };
export const Small: Story = { args: { size: 'sm', variant: 'ghost' } };
export const Disabled: Story = { args: { variant: 'compare', children: 'Compare 1 bike', disabled: true } };
export const AsLink: Story = { args: { href: '/bikes/yamaha-mt-07', variant: 'ghost' } };
