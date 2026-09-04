import type { Meta, StoryObj } from '@storybook/react';
import { TopBar } from '.';
import { SearchInput } from '../SearchInput';

const meta: Meta<typeof TopBar> = {
  title: 'Layout/TopBar',
  component: TopBar,
  parameters: { layout: 'fullscreen' },
  args: {
    navItems: [
      { label: 'All bikes', href: '/', active: true },
      { label: 'Brands', href: '/brands' },
      { label: 'Compare', href: '/compare' },
    ],
    search: <SearchInput variant="dark" defaultValue="" />,
  },
};
export default meta;
type Story = StoryObj<typeof TopBar>;

export const Default: Story = {};
export const WithoutSearch: Story = { args: { search: undefined } };
