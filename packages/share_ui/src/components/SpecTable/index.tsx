import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface SpecColumn {
  /** Matches the values in a `winners` map. */
  id: number | string;
  title: string;
  /** Second line under the title, e.g. `Yamaha · Naked`. */
  meta?: string;
}

export interface SpecRow {
  /** Key used to look the row up in `winners`, e.g. `PowerHp`. */
  field: string;
  label: string;
  /** One entry per column. `null` renders as an em dash. */
  values: Array<ReactNode | null | undefined>;
}

export interface SpecGroup {
  title: string;
  rows: SpecRow[];
}

export interface SpecTableProps {
  columns: SpecColumn[];
  groups: SpecGroup[];
  /** field -> winning column id. Winning cells go red at weight 600. */
  winners?: Record<string, number | string>;
  caption?: string;
  /** Header above the label column. */
  labelHeading?: string;
  className?: string;
}

export function SpecTable({
  columns,
  groups,
  winners,
  caption = 'Specifications',
  labelHeading = 'Specification',
  className,
}: SpecTableProps) {
  return (
    <div className={cx(styles.wrapper, className)}>
      <table className={styles.table}>
        <caption className={styles.caption}>{caption}</caption>
        <thead>
          <tr className={styles.headBand}>
            <th scope="col" className={styles.labelCol}>
              {labelHeading}
            </th>
            {columns.map((column) => (
              <th scope="col" key={column.id}>
                <span className={styles.columnTitle}>{column.title}</span>
                {column.meta ? <span className={styles.columnMeta}>{column.meta}</span> : null}
              </th>
            ))}
          </tr>
        </thead>
        {groups.map((group) => (
          <Fragment key={group.title}>
            <tbody>
              <tr className={styles.groupRow}>
                <th scope="colgroup" colSpan={columns.length + 1}>
                  {group.title}
                </th>
              </tr>
              {group.rows.map((row) => {
                const winnerId = winners?.[row.field];
                return (
                  <tr key={row.field}>
                    <th scope="row" className={styles.rowLabel}>
                      {row.label}
                    </th>
                    {columns.map((column, index) => {
                      const value = row.values[index];
                      const isBlank = value === null || value === undefined || value === '';
                      const isWinner = winnerId !== undefined && winnerId === column.id && !isBlank;
                      return (
                        <td
                          key={column.id}
                          className={cx(styles.cell, isWinner && styles.winner, isBlank && styles.blank)}
                        >
                          {isBlank ? '—' : value}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </Fragment>
        ))}
      </table>
    </div>
  );
}
