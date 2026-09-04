import type { Meta, StoryObj } from '@storybook/react';
import { BrandRail } from '.';
import { brands } from '../../stories/fixtures';

const meta: Meta<typeof BrandRail> = {
  title: 'Domain/BrandRail',
  component: BrandRail,
  args: { items: brands },
};
export default meta;
type Story = StoryObj<typeof BrandRail>;

export const Default: Story = {};
export const WithActiveBrand: Story = {
  args: { items: brands.map((b) => ({ ...b, active: b.name === 'Yamaha' })) },
};
