import { useId } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDownIcon } from '../../icons';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label: string;
  /** Hide the label visually but keep it for screen readers. */
  hideLabel?: boolean;
  options: SelectOption[];
  placeholder?: string;
  size?: 'md' | 'sm';
}

export function Select({
  label,
  hideLabel = false,
  options,
  placeholder,
  size = 'md',
  id,
  className,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className={cx(styles.field, className)}>
      <label className={cx(styles.label, hideLabel && styles.visuallyHidden)} htmlFor={selectId}>
        {label}
      </label>
      <span className={styles.shell}>
        <select id={selectId} className={cx(styles.select, size === 'sm' && styles.sm)} {...rest}>
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className={styles.chevron} />
      </span>
    </div>
  );
}
