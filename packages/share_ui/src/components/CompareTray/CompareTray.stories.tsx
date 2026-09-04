import type { Meta, StoryObj } from '@storybook/react';
import { CompareTray } from '.';

const meta: Meta<typeof CompareTray> = {
  title: 'Domain/CompareTray',
  component: CompareTray,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof CompareTray>;

export const OneBike: Story = {
  args: { bikes: [{ id: 4, name: 'MT-07', brand: 'Yamaha', priceUsd: 8599 }] },
};

export const TwoBikes: Story = {
  args: {
    bikes: [
      { id: 4, name: 'MT-07', brand: 'Yamaha', priceUsd: 8599 },
      { id: 6, name: 'Z900', brand: 'Kawasaki', priceUsd: 9999 },
    ],
    compareHref: '/compare?ids=4,6',
  },
};

export const Full: Story = {
  args: {
    bikes: [
      { id: 4, name: 'MT-07', brand: 'Yamaha', priceUsd: 8599 },
      { id: 6, name: 'Z900', brand: 'Kawasaki', priceUsd: 9999 },
      { id: 9, name: 'R 1300 GS', brand: 'BMW', priceUsd: 18895 },
    ],
    compareHref: '/compare?ids=4,6,9',
  },
};
