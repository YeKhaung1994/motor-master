import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RangeFilter } from '.';

const meta: Meta<typeof RangeFilter> = { title: 'Domain/RangeFilter', component: RangeFilter };
export default meta;
type Story = StoryObj<typeof RangeFilter>;

function EngineSizeDemo() {
  const [min, setMin] = useState('400');
  const [max, setMax] = useState('');
  return (
    <RangeFilter
      title="Engine size"
      suffix="cc"
      minValue={min}
      maxValue={max}
      onMinChange={setMin}
      onMaxChange={setMax}
    />
  );
}

export const EngineSize: Story = { render: () => <EngineSizeDemo /> };
