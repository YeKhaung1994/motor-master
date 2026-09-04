import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';
import type { BikeClass } from '../../lib/types';

export function fetchClasses(brand?: string): Promise<BikeClass[]> {
  return apiGet<BikeClass[]>('/classes', { brand });
}

/** Scoped to a brand when one is given, so the filter only offers what exists. */
export function useClasses(brand?: string) {
  return useQuery({
    queryKey: ['classes', brand ?? 'all'],
    queryFn: () => fetchClasses(brand),
    // Categories only change when a catalogue is imported.
    staleTime: 5 * 60_000,
  });
}
