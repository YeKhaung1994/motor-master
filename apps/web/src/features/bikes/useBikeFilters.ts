import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { BikeFilters, SortKey } from '../../lib/types';

const SORT_KEYS: SortKey[] = ['price_asc', 'price_desc', 'power_desc', 'weight_asc'];

export const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Price, low to high' },
  { value: 'price_desc', label: 'Price, high to low' },
  { value: 'power_desc', label: 'Most power' },
  { value: 'weight_asc', label: 'Lightest first' },
];

function toNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

/**
 * Filters live in the URL, so any view of the catalogue can be shared or
 * bookmarked and the back button steps through filter changes.
 */
export function useBikeFilters(brandSlug?: string) {
  const [searchParams, setSearchParams] = useSearchParams();

  const sortParam = searchParams.get('sort') as SortKey | null;
  const sort: SortKey = sortParam && SORT_KEYS.includes(sortParam) ? sortParam : 'price_asc';

  const classes = useMemo(() => searchParams.getAll('class'), [searchParams]);

  const filters: BikeFilters = useMemo(
    () => ({
      brand: brandSlug,
      class: classes.length > 0 ? classes : undefined,
      ccMin: toNumber(searchParams.get('ccMin')),
      ccMax: toNumber(searchParams.get('ccMax')),
      priceMin: toNumber(searchParams.get('priceMin')),
      priceMax: toNumber(searchParams.get('priceMax')),
      sort,
      page: 1,
      pageSize: 60,
    }),
    [brandSlug, classes, searchParams, sort],
  );

  const toggleClass = useCallback(
    (value: string, checked: boolean) => {
      const next = new URLSearchParams(searchParams);
      const current = next.getAll('class');
      next.delete('class');

      const updated = checked
        ? [...current, value]
        : current.filter((entry) => entry !== value);

      updated.forEach((entry) => next.append('class', entry));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setSort = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams);
      next.set('sort', value);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setRange = useCallback(
    (key: 'ccMin' | 'ccMax' | 'priceMin' | 'priceMax', value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value === '') next.delete(key);
      else next.set(key, value);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const clearAll = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const hasFilters =
    classes.length > 0 ||
    ['ccMin', 'ccMax', 'priceMin', 'priceMax'].some((key) => searchParams.get(key));

  return { filters, classes, sort, toggleClass, setSort, setRange, clearAll, hasFilters };
}
