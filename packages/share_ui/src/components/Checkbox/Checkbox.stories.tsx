import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from '.';

const meta: Meta<typeof Checkbox> = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
  args: { label: 'Adventure' },
};
export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Unchecked: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const WithCount: Story = { args: { count: 4 } };
export const Disabled: Story = { args: { disabled: true, count: 0 } };
