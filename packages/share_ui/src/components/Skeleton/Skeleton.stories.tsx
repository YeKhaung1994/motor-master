import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from '.';

const meta: Meta<typeof Skeleton> = { title: 'Primitives/Skeleton', component: Skeleton };
export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Line: Story = { args: { width: 220 } };
export const CardArt: Story = { args: { width: 270, height: 200 } };
