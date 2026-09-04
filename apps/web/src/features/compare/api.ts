import { apiGet } from '../../lib/api';
import type { CompareResult } from '../../lib/types';

export function fetchCompare(ids: number[]): Promise<CompareResult> {
  return apiGet<CompareResult>('/compare', { ids: ids.join(',') });
}
