import type { Meta, StoryObj } from '@storybook/react';
import { BackLink } from '.';

const meta: Meta<typeof BackLink> = {
  title: 'Domain/BackLink',
  component: BackLink,
  args: { href: '/', context: 'all bikes' },
};
export default meta;
type Story = StoryObj<typeof BackLink>;

export const Default: Story = {};
export const FromBrand: Story = { args: { href: '/brands/yamaha', context: 'Yamaha' } };
