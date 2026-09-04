import { SpecTable } from '../SpecTable';
import type { SpecColumn, SpecGroup } from '../SpecTable';

export interface CompareColumn extends SpecColumn {
  brand: string;
  class: string;
}

export interface CompareTableProps {
  columns: CompareColumn[];
  groups: SpecGroup[];
  /** field -> winning bike id, computed by the API. */
  winners: Record<string, number | string>;
  className?: string;
}

/**
 * A SpecTable driven by a winners map: each column header carries the model name
 * plus `brand · class`, and the best figure in a row is picked out in red.
 */
export function CompareTable({ columns, groups, winners, className }: CompareTableProps) {
  return (
    <SpecTable
      className={className}
      caption="Side-by-side specifications"
      columns={columns.map((column) => ({
        id: column.id,
        title: column.title,
        meta: column.meta ?? `${column.brand} · ${column.class}`,
      }))}
      groups={groups}
      winners={winners}
    />
  );
}
