import { useState } from 'react';
import { Checkbox } from '../Checkbox';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterGroupProps {
  title: string;
  options: FilterOption[];
  selected: string[];
  onChange: (value: string, checked: boolean) => void;
  /**
   * Show at most this many options until the reader asks for the rest. An
   * imported catalogue can carry dozens of categories, and a filter taller than
   * the window is not a filter.
   */
  maxVisible?: number;
  className?: string;
}

export function FilterGroup({
  title,
  options,
  selected,
  onChange,
  maxVisible,
  className,
}: FilterGroupProps) {
  const [expanded, setExpanded] = useState(false);

  const canCollapse = maxVisible !== undefined && options.length > maxVisible;
  // A chosen option always stays visible, wherever it sits in the list.
  const visible =
    canCollapse && !expanded
      ? options.filter((option, index) => index < maxVisible || selected.includes(option.value))
      : options;
  const hiddenCount = options.length - visible.length;

  return (
    <fieldset className={cx(styles.group, className)}>
      <legend className={styles.legend}>{title}</legend>
      <div className={styles.options}>
        {visible.map((option) => (
          <Checkbox
            key={option.value}
            label={option.label}
            count={option.count}
            checked={selected.includes(option.value)}
            onChange={(event) => onChange(option.value, event.target.checked)}
          />
        ))}
      </div>
      {canCollapse ? (
        <button type="button" className={styles.toggle} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show fewer' : `Show ${hiddenCount} more`}
        </button>
      ) : null}
    </fieldset>
  );
}
