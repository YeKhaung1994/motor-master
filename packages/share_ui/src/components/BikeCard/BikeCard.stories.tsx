import type { Meta, StoryObj } from '@storybook/react';
import { BikeCard } from '.';
import { bikes } from '../../stories/fixtures';

const meta: Meta<typeof BikeCard> = {
  title: 'Domain/BikeCard',
  component: BikeCard,
  args: { bike: bikes[1]! },
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof BikeCard>;

export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const CompareFull: Story = { args: { compareDisabled: true } };
export const NoPhotoOrPrice: Story = {
  args: { bike: { ...bikes[7]!, price: null } },
};
export const FiguresNotPublished: Story = { args: { bike: bikes[6]! } };
