import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from '.';
import { CloseIcon } from '../../icons';

const meta: Meta<typeof IconButton> = {
  title: 'Primitives/IconButton',
  component: IconButton,
  args: { label: 'Remove from compare', children: <CloseIcon size={14} /> },
};
export default meta;
type Story = StoryObj<typeof IconButton>;

export const Ghost: Story = {};
export const Outlined: Story = { args: { variant: 'outlined' } };
export const OnInk: Story = {
  args: { variant: 'onInk' },
  parameters: { backgrounds: { default: 'tyre' } },
};
