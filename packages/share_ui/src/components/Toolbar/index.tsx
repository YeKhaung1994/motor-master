import type { ReactNode } from 'react';
import { Select } from '../Select';
import type { SelectOption } from '../Select';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface ToolbarProps {
  heading: string;
  /** Rendered as "12 bikes" — pass the noun so one bike reads correctly. */
  count?: number;
  countNoun?: string;
  sortOptions?: SelectOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  children?: ReactNode;
  className?: string;
}

export function Toolbar({
  heading,
  count,
  countNoun = 'bike',
  sortOptions,
  sortValue,
  onSortChange,
  children,
  className,
}: ToolbarProps) {
  return (
    <div className={cx(styles.toolbar, className)}>
      <div className={styles.headings}>
        <h1 className={styles.title}>{heading}</h1>
        {typeof count === 'number' ? (
          <span className={styles.count}>
            {count} {count === 1 ? countNoun : `${countNoun}s`}
          </span>
        ) : null}
      </div>
      {children}
      {sortOptions ? (
        <Select
          className={styles.sort}
          label="Sort by"
          size="sm"
          options={sortOptions}
          value={sortValue}
          onChange={(event) => onSortChange?.(event.target.value)}
        />
      ) : null}
    </div>
  );
}
