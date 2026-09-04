import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface FloatingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: ReactNode;
  /** Number of bikes already picked; omitted when none are. */
  count?: number;
  /** Lift clear of the compare tray when it is open. */
  raised?: boolean;
}

export function FloatingButton({
  label,
  icon,
  count,
  raised = false,
  className,
  type = 'button',
  ...rest
}: FloatingButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, raised && styles.raised, className)}
      {...rest}
    >
      {icon}
      {label}
      {count ? <span className={styles.count}>{count}</span> : null}
    </button>
  );
}
