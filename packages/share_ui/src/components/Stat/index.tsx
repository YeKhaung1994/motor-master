import type { HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface StatProps extends HTMLAttributes<HTMLDivElement> {
  value: string | number;
  unit?: string;
  label: string;
  /** `sm` (22 px) on cards, `lg` (28 px) on detail pages. */
  size?: 'sm' | 'lg';
  /** Red treatment — reserved for the winning figure in a comparison. */
  winner?: boolean;
}

export function Stat({
  value,
  unit,
  label,
  size = 'sm',
  winner = false,
  className,
  ...rest
}: StatProps) {
  return (
    <div className={cx(styles.stat, styles[size], winner && styles.winner, className)} {...rest}>
      <span className={styles.figure}>
        {value}
        {unit ? <span className={styles.unit}>{unit}</span> : null}
      </span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
