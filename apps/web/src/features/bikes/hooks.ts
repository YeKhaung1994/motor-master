import { keepPreviousData, useQuery } from '@tanstack/react-query';
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
