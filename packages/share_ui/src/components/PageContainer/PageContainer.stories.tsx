import type { Meta, StoryObj } from '@storybook/react';
import { PageContainer } from '.';
import { Heading } from '../Heading';
import { Text } from '../Text';

const meta: Meta<typeof PageContainer> = {
  title: 'Layout/PageContainer',
  component: PageContainer,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof PageContainer>;

export const Default: Story = {
  render: () => (
    <PageContainer>
      <Heading level={1}>Every bike, one spec sheet</Heading>
      <Text tone="muted">28 px of horizontal padding, capped at 1440 px.</Text>
    </PageContainer>
  ),
};
