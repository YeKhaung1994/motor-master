import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from '.';
import { Button } from '../Button';

const meta: Meta<typeof EmptyState> = { title: 'Primitives/EmptyState', component: EmptyState };
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const NoResults: Story = {
  args: {
    headline: 'No bikes match these filters',
    body: 'Try widening the engine size range or clearing a brand.',
    action: <Button variant="ghost">Clear filters</Button>,
  },
};

export const LoadFailed: Story = {
  args: {
    headline: "Couldn't load bikes",
    body: 'Check your connection and try again.',
    action: <Button>Try again</Button>,
  },
};
