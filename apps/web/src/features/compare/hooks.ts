import { useQuery } from '@tanstack/react-query';
import { fetchCompare } from './api';

export function useCompareBikes(ids: number[]) {
  return useQuery({
    queryKey: ['compare', ids],
    queryFn: () => fetchCompare(ids),
    enabled: ids.length >= 2,
  });
}
