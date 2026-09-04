import type { Meta, StoryObj } from '@storybook/react';
import { Logo } from '.';

const meta: Meta<typeof Logo> = { title: 'Layout/Logo', component: Logo };
export default meta;
type Story = StoryObj<typeof Logo>;

export const OnPage: Story = {};
export const OnDark: Story = {
  args: { onDark: true },
  parameters: { backgrounds: { default: 'tyre' } },
};
