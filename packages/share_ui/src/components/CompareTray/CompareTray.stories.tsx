import type { Meta, StoryObj } from '@storybook/react';
import { CompareTray } from '.';

const meta: Meta<typeof CompareTray> = {
  title: 'Domain/CompareTray',
  component: CompareTray,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof CompareTray>;

const price = (amount: number, text: string) => ({
  amount,
  currency: 'THB',
  text,
  isApproximate: false,
});

export const OneBike: Story = {
  args: {
    bikes: [{ id: 2, name: 'CBR500R', brand: 'Honda', price: price(235800, 'THB 235,800') }],
  },
};

export const TwoBikes: Story = {
  args: {
    bikes: [
      { id: 2, name: 'CBR500R', brand: 'Honda', price: price(235800, 'THB 235,800') },
      { id: 4, name: 'ADV350', brand: 'Honda', price: price(181900, 'THB 181,900 / 183,900') },
    ],
    compareHref: '/compare?ids=2,4',
  },
};

/** A model whose Thai price the manufacturer has not published. */
export const Full: Story = {
  args: {
    bikes: [
      { id: 2, name: 'CBR500R', brand: 'Honda', price: price(235800, 'THB 235,800') },
      { id: 4, name: 'ADV350', brand: 'Honda', price: price(181900, 'THB 181,900 / 183,900') },
      { id: 3, name: 'CB650R', brand: 'Honda', price: null },
    ],
    compareHref: '/compare?ids=2,4,3',
  },
};
