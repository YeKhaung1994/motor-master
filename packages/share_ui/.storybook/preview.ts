import type { Preview } from '@storybook/react';
import '../src/tokens/tokens.css';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: {
      default: 'page',
      values: [
        { name: 'page', value: '#EEF0F2' },
        { name: 'panel', value: '#FFFFFF' },
        { name: 'tyre', value: '#2B3036' },
      ],
    },
  },
};

export default preview;
