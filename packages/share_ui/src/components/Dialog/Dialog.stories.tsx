import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Dialog } from '.';
import { Button } from '../Button';
import { Text } from '../Text';

const meta: Meta<typeof Dialog> = { title: 'Primitives/Dialog', component: Dialog };
export default meta;
type Story = StoryObj<typeof Dialog>;

function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open quick compare</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Quick compare">
        <Text tone="muted">Escape, the backdrop and the close button all dismiss it.</Text>
      </Dialog>
    </>
  );
}

export const Default: Story = { render: () => <Demo /> };
