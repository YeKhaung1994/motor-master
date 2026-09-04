import type { Meta, StoryObj } from '@storybook/react';
import { Toolbar } from '.';
import { sortOptions } from '../../stories/fixtures';

const meta: Meta<typeof Toolbar> = {
  title: 'Domain/Toolbar',
  component: Toolbar,
  args: { heading: 'All bikes', count: 12, sortOptions, sortValue: 'price_asc' },
};
export default meta;
type Story = StoryObj<typeof Toolbar>;

export const Default: Story = {};
export const SingleResult: Story = { args: { count: 1 } };
export const WithoutSort: Story = { args: { sortOptions: undefined } };
