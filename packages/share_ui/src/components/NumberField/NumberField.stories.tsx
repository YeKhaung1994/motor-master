import type { Meta, StoryObj } from '@storybook/react';
import { NumberField } from '.';

const meta: Meta<typeof NumberField> = {
  title: 'Primitives/NumberField',
  component: NumberField,
  args: { label: 'From', suffix: 'cc', placeholder: 'Any' },
};
export default meta;
type Story = StoryObj<typeof NumberField>;

export const Default: Story = {};
export const WithValue: Story = { args: { defaultValue: 400 } };
