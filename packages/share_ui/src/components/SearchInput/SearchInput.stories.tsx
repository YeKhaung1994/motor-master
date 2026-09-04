import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SearchInput } from '.';

const meta: Meta<typeof SearchInput> = {
  title: 'Primitives/SearchInput',
  component: SearchInput,
};
export default meta;
type Story = StoryObj<typeof SearchInput>;

function Demo({ variant }: { variant: 'light' | 'dark' }) {
  const [value, setValue] = useState('CB');
  return (
    <SearchInput
      variant={variant}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      suggestions={[
        { id: 1, name: 'CB650R', brand: 'Honda', slug: 'honda-cb650r' },
        { id: 2, name: 'CRF300L', brand: 'Honda', slug: 'honda-crf300l' },
      ]}
    />
  );
}

export const Light: Story = { render: () => <Demo variant="light" /> };
export const Dark: Story = {
  render: () => <Demo variant="dark" />,
  parameters: { backgrounds: { default: 'tyre' } },
};
