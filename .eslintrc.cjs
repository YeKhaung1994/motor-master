/* eslint-env node */

/**
 * The share_ui-only rule. apps/web composes screens; it never draws them.
 * Any interactive or tabular HTML element must come from @motor-master/share_ui.
 */
const REPLACEMENTS = {
  button: 'Button or IconButton',
  input: 'SearchInput, NumberField or Checkbox',
  select: 'Select',
  table: 'SpecTable or CompareTable',
  textarea: 'a new share_ui component',
};

const SHARE_UI_ONLY = Object.entries(REPLACEMENTS).map(([tag, replacement]) => ({
  selector: `JSXOpeningElement[name.name='${tag}']`,
  message: `Use share_ui's ${replacement} instead of a raw <${tag}>. Every visual element in apps/web comes from @motor-master/share_ui — if the component does not exist yet, add it there first.`,
}));

module.exports = {
  root: true,
  env: { es2022: true, browser: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  settings: { react: { version: '18.3' } },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'storybook-static/',
    'coverage/',
    '*.cjs',
    '*.config.js',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: ['apps/web/src/**/*.tsx'],
      rules: {
        'no-restricted-syntax': ['error', ...SHARE_UI_ONLY],
        'react/forbid-dom-props': ['error', { forbid: ['style'] }],
      },
    },
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.stories.tsx'],
      rules: { '@typescript-eslint/no-explicit-any': 'off' },
    },
  ],
};
