import type { Meta, StoryObj } from '@storybook/react';
import { Text } from '.';

const meta: Meta<typeof Text> = {
  title: 'Primitives/Text',
  component: Text,
  args: { children: 'MSRP, before on-road costs' },
};
export default meta;
type Story = StoryObj<typeof Text>;

export const Body: Story = {};
export const Muted: Story = { args: { tone: 'muted', size: 'sm' } };
export const Small: Story = { args: { size: 'xs', tone: 'steel' } };
