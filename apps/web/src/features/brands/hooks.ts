import { useQuery } from '@tanstack/react-query';
import { fetchBrands } from './api';

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
    // The brand list changes only when a catalogue is imported.
    staleTime: 5 * 60_000,
  });
}
