import type { Meta, StoryObj } from '@storybook/react';
import { Heading } from '.';

const meta: Meta<typeof Heading> = {
  title: 'Primitives/Heading',
  component: Heading,
  args: { children: 'Every bike, one spec sheet' },
};
export default meta;
type Story = StoryObj<typeof Heading>;

export const Level1: Story = { args: { level: 1 } };
export const Level2: Story = { args: { level: 2 } };
export const Level3: Story = { args: { level: 3 } };
export const Hero: Story = { args: { level: 1, size: 'xl' } };
