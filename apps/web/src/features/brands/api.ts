import { apiGet } from '../../lib/api';
import type { Brand } from '../../lib/types';

export function fetchBrands(): Promise<Brand[]> {
  return apiGet<Brand[]>('/brands');
}
