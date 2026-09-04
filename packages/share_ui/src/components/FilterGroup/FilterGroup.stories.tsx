import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FilterGroup } from '.';
import { classes } from '../../stories/fixtures';

const meta: Meta<typeof FilterGroup> = { title: 'Domain/FilterGroup', component: FilterGroup };
export default meta;
type Story = StoryObj<typeof FilterGroup>;

export const Classes: Story = {
  render: () => {
    const [selected, setSelected] = useState<string[]>(['Naked']);
    return (
      <FilterGroup
        title="Class"
        options={classes}
        selected={selected}
        onChange={(value, checked) =>
          setSelected((current) =>
            checked ? [...current, value] : current.filter((item) => item !== value),
          )
        }
      />
    );
  },
};
