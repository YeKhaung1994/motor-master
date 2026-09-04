import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { BikeFilters } from '../../lib/types';
import { fetchBike, fetchBikes, searchBikes } from './api';

export function useBikes(filters: BikeFilters) {
  return useQuery({
    queryKey: ['bikes', filters],
    queryFn: () => fetchBikes(filters),
    // Keeps the current grid on screen while a filter change loads.
    placeholderData: keepPreviousData,
  });
}

/**
 * The catalogue is larger than one page, and the API caps a page at 60, so the
 * grid loads a page at a time rather than claiming a total it cannot show.
 */
export function useBikePages(filters: BikeFilters) {
  return useInfiniteQuery({
    queryKey: ['bikes', 'paged', filters],
    queryFn: ({ pageParam }) => fetchBikes({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.pageSize;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
    placeholderData: keepPreviousData,
  });
}

export function useBike(slug: string | undefined) {
  return useQuery({
    queryKey: ['bike', slug],
    queryFn: () => fetchBike(slug as string),
    enabled: Boolean(slug),
  });
}

export function useBikeSearch(term: string) {
  const query = term.trim();
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => searchBikes(query),
    enabled: query.length > 0,
    staleTime: 30_000,
  });
}
