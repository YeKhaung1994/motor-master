import type { Meta, StoryObj } from '@storybook/react';
import { Select } from '.';
import { sortOptions } from '../../stories/fixtures';

const meta: Meta<typeof Select> = {
  title: 'Primitives/Select',
  component: Select,
  args: { label: 'Sort by', options: sortOptions, defaultValue: 'price_asc' },
};
export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {};
export const WithPlaceholder: Story = {
  args: { label: 'First bike', placeholder: 'Pick a bike', defaultValue: '' },
};
export const HiddenLabel: Story = { args: { hideLabel: true } };
export const Disabled: Story = { args: { disabled: true } };
