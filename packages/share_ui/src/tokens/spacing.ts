export const space = {
  1: 'var(--mm-space-1)',
  2: 'var(--mm-space-2)',
  3: 'var(--mm-space-3)',
  4: 'var(--mm-space-4)',
  5: 'var(--mm-space-5)',
  6: 'var(--mm-space-6)',
  8: 'var(--mm-space-8)',
} as const;

export const radius = 'var(--mm-radius)';
export const focusRing = 'var(--mm-focus)';
export const trayShadow = 'var(--mm-tray-shadow)';

export type SpaceToken = keyof typeof space;
