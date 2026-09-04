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
  className?: string;
}

export function FilterGroup({ title, options, selected, onChange, className }: FilterGroupProps) {
  return (
    <fieldset className={cx(styles.group, className)}>
      <legend className={styles.legend}>{title}</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <Checkbox
            key={option.value}
            label={option.label}
            count={option.count}
            checked={selected.includes(option.value)}
            onChange={(event) => onChange(option.value, event.target.checked)}
          />
        ))}
      </div>
    </fieldset>
  );
}
