import { Button } from '../Button';
import { Select } from '../Select';
import type { SelectOption } from '../Select';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface HeroCompareBoxProps {
  title?: string;
  options: SelectOption[];
  /** Three slots; the third is optional, so an empty string is expected. */
  values: [string, string, string];
  onChange: (index: 0 | 1 | 2, value: string) => void;
  onCompare: () => void;
  className?: string;
}

const SLOT_LABELS = ['First bike', 'Second bike', 'Third bike (optional)'] as const;

export function HeroCompareBox({
  title = 'Quick compare',
  options,
  values,
  onChange,
  onCompare,
  className,
}: HeroCompareBoxProps) {
  const chosen = values.filter(Boolean);
  const ready = chosen.length >= 2;

  return (
    <div className={cx(styles.box, className)}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.slots}>
        {SLOT_LABELS.map((label, index) => (
          <Select
            key={label}
            label={label}
            options={options.filter(
              (option) => option.value === values[index] || !chosen.includes(option.value),
            )}
            placeholder={index === 2 ? 'Nothing selected' : 'Pick a bike'}
            value={values[index]}
            onChange={(event) => onChange(index as 0 | 1 | 2, event.target.value)}
          />
        ))}
      </div>
      <Button variant="compare" onClick={onCompare} disabled={!ready}>
        Compare these
      </Button>
      <p className={styles.hint}>Pick at least two bikes to see them side by side.</p>
    </div>
  );
}
