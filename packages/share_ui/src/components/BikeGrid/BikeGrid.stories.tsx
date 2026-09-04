import type { Meta, StoryObj } from '@storybook/react';
import { BikeGrid } from '.';
import { BikeCard } from '../BikeCard';
import { bikes } from '../../stories/fixtures';

const meta: Meta<typeof BikeGrid> = {
  title: 'Domain/BikeGrid',
  component: BikeGrid,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof BikeGrid>;

export const Default: Story = {
  render: () => (
    <BikeGrid>
      {bikes.slice(0, 6).map((bike) => (
        <BikeCard key={bike.id} bike={bike} />
      ))}
    </BikeGrid>
  ),
};
