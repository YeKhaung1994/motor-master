import type { Meta, StoryObj } from '@storybook/react';
import { FloatingButton } from '.';

const meta: Meta<typeof FloatingButton> = {
  title: 'Domain/FloatingButton',
  component: FloatingButton,
  parameters: { layout: 'fullscreen' },
  args: { label: 'Quick compare' },
};
export default meta;
type Story = StoryObj<typeof FloatingButton>;

export const Default: Story = {};
export const WithCount: Story = { args: { count: 2 } };
/** Lifted so it never covers the compare tray. */
export const AboveTheTray: Story = { args: { count: 2, raised: true } };
