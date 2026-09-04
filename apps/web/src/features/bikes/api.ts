import { apiGet } from '../../lib/api';
import type { BikeDetail, BikeFilters, BikeList, SearchHit } from '../../lib/types';

export function fetchBikes(filters: BikeFilters): Promise<BikeList> {
  return apiGet<BikeList>('/bikes', { ...filters });
}

export function fetchBike(slug: string): Promise<BikeDetail> {
  return apiGet<BikeDetail>(`/bikes/${encodeURIComponent(slug)}`);
}

export function searchBikes(q: string): Promise<SearchHit[]> {
  return apiGet<SearchHit[]>('/search', { q });
}
