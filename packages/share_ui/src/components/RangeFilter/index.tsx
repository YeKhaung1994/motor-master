import { NumberField } from '../NumberField';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface RangeFilterProps {
  title: string;
  suffix?: string;
  min?: number;
  max?: number;
  /** Empty string means "no bound". */
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  className?: string;
}

export function RangeFilter({
  title,
  suffix,
  min = 0,
  max,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  className,
}: RangeFilterProps) {
  return (
    <fieldset className={cx(styles.group, className)}>
      <legend className={styles.legend}>{title}</legend>
      <div className={styles.row}>
        <NumberField
          label="From"
          suffix={suffix}
          placeholder="Any"
          min={min}
          max={max}
          value={minValue}
          onChange={(event) => onMinChange(event.target.value)}
        />
        <NumberField
          label="To"
          suffix={suffix}
          placeholder="Any"
          min={min}
          max={max}
          value={maxValue}
          onChange={(event) => onMaxChange(event.target.value)}
        />
      </div>
    </fieldset>
  );
}
