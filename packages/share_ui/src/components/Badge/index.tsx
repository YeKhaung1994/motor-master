import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'solid' | 'outline';
  children: ReactNode;
}

export function Badge({ variant = 'solid', className, children, ...rest }: BadgeProps) {
  return (
    <span className={cx(styles.badge, variant === 'outline' && styles.outline, className)} {...rest}>
      {children}
    </span>
  );
}
