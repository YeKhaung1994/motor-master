import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export type IconButtonVariant = 'ghost' | 'onInk' | 'outlined';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Always required — the icon alone carries no accessible name. */
  label: string;
  variant?: IconButtonVariant;
  size?: 'md' | 'sm';
  children: ReactNode;
}

export function IconButton({
  label,
  variant = 'ghost',
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(styles.iconButton, styles[variant], styles[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}
