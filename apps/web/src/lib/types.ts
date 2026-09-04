/** Mirrors the API's DTOs (apps/api/src/types.ts). */

export interface Brand {
  id: number;
  name: string;
  countryCode: string;
  slug: string;
  modelCount: number;
}

export interface BikeCardDto {
  id: number;
  slug: string;
  name: string;
  brand: string;
  class: string;
  cc: number;
  hp: number;
  kg: number;
  priceUsd: number;
  imageUrl: string | null;
}

export interface BikeSpecs {
  engine: string | null;
  displacementCc: number | null;
  powerHp: number | null;
  torqueNm: number | null;
  transmission: string | null;
  frontSuspension: string | null;
  rearSuspension: string | null;
  brakes: string | null;
  tyres: string | null;
  wheelbaseMm: number | null;
  kerbWeightKg: number | null;
  seatHeightMm: number | null;
  fuelTankL: number | null;
  riderAids: string | null;
  display: string | null;
}

export interface BikeDetail {
  id: number;
  slug: string;
  name: string;
  brand: string;
  brandSlug: string;
  class: string;
  modelYear: number;
  priceUsd: number;
  imageUrl: string | null;
  specs: BikeSpecs;
}

export interface BikeList {
  items: BikeCardDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CompareResult {
  bikes: BikeDetail[];
  winners: Record<string, number>;
}

export interface SearchHit {
  id: number;
  name: string;
  brand: string;
  slug: string;
}

export type SortKey = 'price_asc' | 'price_desc' | 'power_desc' | 'weight_asc';

export interface BikeFilters {
  brand?: string;
  class?: string[];
  ccMin?: number;
  ccMax?: number;
  priceMin?: number;
  priceMax?: number;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
}
