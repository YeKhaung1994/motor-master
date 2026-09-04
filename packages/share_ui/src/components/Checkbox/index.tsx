import type { InputHTMLAttributes } from 'react';
import { CheckIcon } from '../../icons';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  /** Optional trailing count, e.g. the number of bikes in a class. */
  count?: number;
}

export function Checkbox({ label, count, className, ...rest }: CheckboxProps) {
  return (
    <label className={cx(styles.root, className)}>
      <input type="checkbox" className={styles.input} {...rest} />
      <span className={styles.box} aria-hidden="true">
        <CheckIcon size={11} strokeWidth={2.4} />
      </span>
      <span className={styles.label}>
        {label}
        {typeof count === 'number' ? <span className={styles.count}>{count}</span> : null}
      </span>
    </label>
  );
}
