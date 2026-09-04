import type { Meta, StoryObj } from '@storybook/react';
import { SidebarLayout } from '.';
import { BrandRail } from '../BrandRail';
import { Heading } from '../Heading';
import { brands } from '../../stories/fixtures';

const meta: Meta<typeof SidebarLayout> = {
  title: 'Layout/SidebarLayout',
  component: SidebarLayout,
};
export default meta;
type Story = StoryObj<typeof SidebarLayout>;

export const Default: Story = {
  render: () => (
    <SidebarLayout sidebar={<BrandRail items={brands} />}>
      <Heading level={1}>All bikes</Heading>
    </SidebarLayout>
  ),
};
