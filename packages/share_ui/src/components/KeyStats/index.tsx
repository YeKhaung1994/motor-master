import { Stat } from '../Stat';
import type { StatProps } from '../Stat';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface KeyStatsProps {
  items: Array<Pick<StatProps, 'value' | 'unit' | 'label'>>;
  className?: string;
}

export function KeyStats({ items, className }: KeyStatsProps) {
  return (
    <div className={cx(styles.grid, className)}>
      {items.map((item) => (
        <div className={styles.tile} key={item.label}>
          <Stat size="lg" {...item} />
        </div>
      ))}
    </div>
  );
}
