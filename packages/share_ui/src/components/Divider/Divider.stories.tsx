import type { Meta, StoryObj } from '@storybook/react';
import { Divider } from '.';

const meta: Meta<typeof Divider> = { title: 'Primitives/Divider', component: Divider };
export default meta;
type Story = StoryObj<typeof Divider>;

export const Horizontal: Story = {};
export const Spaced: Story = { args: { spaced: true } };
