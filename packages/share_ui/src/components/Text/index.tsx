import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export type TextSize = 'xs' | 'sm' | 'md' | 'lg';
export type TextTone = 'ink' | 'muted' | 'steel' | 'red' | 'panel';
export type TextWeight = 'regular' | 'medium' | 'semibold';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  size?: TextSize;
  tone?: TextTone;
  weight?: TextWeight;
  children?: ReactNode;
}

export function Text({
  as: Tag = 'p',
  size = 'md',
  tone = 'ink',
  weight = 'regular',
  className,
  children,
  ...rest
}: TextProps) {
  return (
    <Tag
      className={cx(styles.text, styles[size], styles[tone], styles[weight], className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
