import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface BikeGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function BikeGrid({ className, children, ...rest }: BikeGridProps) {
  return (
    <div className={cx(styles.grid, className)} {...rest}>
      {children}
    </div>
  );
}
