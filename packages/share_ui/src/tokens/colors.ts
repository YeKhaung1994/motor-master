/**
 * Colour tokens. Values mirror tokens.css; components should prefer the CSS
 * variable so a theme override in one place changes everything.
 */
export const colors = {
  bg: 'var(--mm-bg)',
  panel: 'var(--mm-panel)',
  ink: 'var(--mm-ink)',
  tyre: 'var(--mm-tyre)',
  steel: 'var(--mm-steel)',
  line: 'var(--mm-line)',
  muted: 'var(--mm-muted)',
  /** Compare actions and winning spec values only. Never decorative. */
  red: 'var(--mm-red)',
} as const;

export const colorValues = {
  bg: '#EEF0F2',
  panel: '#FFFFFF',
  ink: '#1B1F23',
  tyre: '#2B3036',
  steel: '#AEB5BC',
  line: '#D5DAE0',
  muted: '#4B535B',
  red: '#C8102E',
} as const;

export type ColorToken = keyof typeof colors;
