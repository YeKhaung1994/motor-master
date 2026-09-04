import type { Meta, StoryObj } from '@storybook/react';
import { BikeImage } from '.';

const meta: Meta<typeof BikeImage> = {
  title: 'Domain/BikeImage',
  component: BikeImage,
  args: { alt: 'Honda CB650R' },
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof BikeImage>;

export const NoPhoto: Story = { args: { src: null } };
export const BrokenFile: Story = { args: { src: '/bikes/does-not-exist.jpg' } };
