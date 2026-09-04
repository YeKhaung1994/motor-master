import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface NumberFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  /** Unit shown inside the field, e.g. `cc` or `$`. */
  suffix?: string;
}

export function NumberField({ label, suffix, id, className, ...rest }: NumberFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div className={cx(styles.field, className)}>
      <label className={styles.label} htmlFor={fieldId}>
        {label}
      </label>
      <span className={styles.shell}>
        <input id={fieldId} type="number" inputMode="numeric" className={styles.input} {...rest} />
        {suffix ? <span className={styles.suffix}>{suffix}</span> : null}
      </span>
    </div>
  );
}
