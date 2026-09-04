import type { Meta, StoryObj } from '@storybook/react';
import { Footer } from '.';

const meta: Meta<typeof Footer> = {
  title: 'Layout/Footer',
  component: Footer,
  parameters: { layout: 'fullscreen' },
  args: { byline: 'Built by YK' },
};
export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {};

export const WithBrandColumn: Story = {
  args: {
    columns: [
      {
        title: 'Browse',
        links: [
          { label: 'All bikes', href: '/' },
          { label: 'Brands', href: '/brands' },
          { label: 'Compare', href: '/compare' },
        ],
      },
      {
        title: 'Brands',
        links: [
          { label: 'Honda', href: '/brands/honda' },
          { label: 'Yamaha', href: '/brands/yamaha' },
          { label: 'Kawasaki', href: '/brands/kawasaki' },
          { label: 'Ducati', href: '/brands/ducati' },
        ],
      },
      { title: 'About the data', links: [{ label: 'Image credits', href: '/credits' }] },
    ],
  },
};

export const WithoutByline: Story = { args: { byline: undefined } };
