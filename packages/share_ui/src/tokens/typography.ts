export const fonts = {
  display: 'var(--mm-font-display)',
  body: 'var(--mm-font-body)',
} as const;

export const textScale = {
  xs: 'var(--mm-text-xs)',
  sm: 'var(--mm-text-sm)',
  md: 'var(--mm-text-md)',
  lg: 'var(--mm-text-lg)',
} as const;

export const displayScale = {
  sm: 'var(--mm-display-sm)',
  md: 'var(--mm-display-md)',
  lg: 'var(--mm-display-lg)',
  xl: 'var(--mm-display-xl)',
} as const;

export type TextScaleToken = keyof typeof textScale;
export type DisplayScaleToken = keyof typeof displayScale;
