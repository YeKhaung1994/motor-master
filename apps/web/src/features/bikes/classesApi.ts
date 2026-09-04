import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';
import type { BikeClass } from '../../lib/types';

export function fetchClasses(): Promise<BikeClass[]> {
  return apiGet<BikeClass[]>('/classes');
}

export function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
    // Categories only change when a catalogue is imported.
    staleTime: 5 * 60_000,
  });
}
