import type { HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  spaced?: boolean;
}

export function Divider({
  orientation = 'horizontal',
  spaced = false,
  className,
  ...rest
}: DividerProps) {
  return (
    <hr
      className={cx(
        styles.divider,
        orientation === 'vertical' && styles.vertical,
        spaced && styles.spaced,
        className,
      )}
      {...rest}
    />
  );
}
