import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { HeroCompareBox } from '.';
import { bikes } from '../../stories/fixtures';

const meta: Meta<typeof HeroCompareBox> = {
  title: 'Domain/HeroCompareBox',
  component: HeroCompareBox,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof HeroCompareBox>;

const options = bikes.map((bike) => ({
  value: String(bike.id),
  label: `${bike.brand} ${bike.name}`,
}));

export const Default: Story = {
  render: () => {
    const [values, setValues] = useState<[string, string, string]>(['4', '6', '']);
    return (
      <HeroCompareBox
        options={options}
        values={values}
        onChange={(index, value) =>
          setValues((current) => {
            const next = [...current] as [string, string, string];
            next[index] = value;
            return next;
          })
        }
        onCompare={() => undefined}
      />
    );
  },
};

export const Empty: Story = {
  render: () => (
    <HeroCompareBox
      options={options}
      values={['', '', '']}
      onChange={() => undefined}
      onCompare={() => undefined}
    />
  ),
};
