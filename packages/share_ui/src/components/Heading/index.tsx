import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export type HeadingLevel = 1 | 2 | 3 | 4;
export type HeadingSize = 'sm' | 'md' | 'lg' | 'xl';
export type HeadingTone = 'ink' | 'panel' | 'muted' | 'red';

/** Levels map onto the display scale; `size` overrides when the visual
 *  hierarchy and the document outline need to differ. */
const LEVEL_SIZE: Record<HeadingLevel, HeadingSize> = { 1: 'lg', 2: 'md', 3: 'sm', 4: 'sm' };

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  size?: HeadingSize;
  tone?: HeadingTone;
  children?: ReactNode;
}

export function Heading({
  level = 2,
  size,
  tone = 'ink',
  className,
  children,
  ...rest
}: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag
      className={cx(styles.heading, styles[size ?? LEVEL_SIZE[level]], styles[tone], className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
