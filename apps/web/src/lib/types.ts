/** Mirrors the API's DTOs (apps/api/src/types.ts). */

export interface Brand {
  id: number;
  name: string;
  countryCode: string | null;
  slug: string;
  modelCount: number;
}

export interface BikeClass {
  name: string;
  modelCount: number;
}

/**
 * `text` is the manufacturer's own wording and is what gets shown; `amount` is
 * the base figure parsed from it, used only for sorting and filtering.
 */
export interface Price {
  amount: number | null;
  currency: string | null;
  market: string | null;
  text: string | null;
  isApproximate: boolean;
}

export interface MarketPrice {
  market: string;
  currency: string | null;
  amount: number | null;
  text: string;
}

export interface BikeCardDto {
  id: number;
  slug: string;
  name: string;
  brand: string;
  class: string;
  cc: number | null;
  hp: number | null;
  kg: number | null;
  price: Price | null;
  imageUrl: string | null;
  flags: string | null;
  dataGeneratedAt: string | null;
}

export interface BikeSpecs {
  engine: string | null;
  displacementCc: number | null;
  boreStrokeMm: string | null;
  compression: string | null;
  powerHp: number | null;
  powerKw: number | null;
  powerRpm: number | null;
  torqueNm: number | null;
  torqueRpm: number | null;
  fuelSystem: string | null;
  transmission: string | null;
  clutch: string | null;
  finalDrive: string | null;
  frame: string | null;
  frontSuspension: string | null;
  rearSuspension: string | null;
  brakeFront: string | null;
  brakeRear: string | null;
  tyreFront: string | null;
  tyreRear: string | null;
  wheelbaseMm: number | null;
  seatHeightMm: number | null;
  groundClearanceMm: number | null;
  kerbWeightKg: number | null;
  fuelTankL: number | null;
  fuelEconomy: string | null;
  batteryKwh: number | null;
  rangeKm: number | null;
  charging: string | null;
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
  price: Price | null;
  imageUrl: string | null;
  markets: string[];
  otherPrices: MarketPrice[];
  variants: string | null;
  notes: string | null;
  flags: string | null;
  sourceUrl: string | null;
  priceSourceUrl: string | null;
  dataGeneratedAt: string | null;
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
  market?: string;
  ccMin?: number;
  ccMax?: number;
  priceMin?: number;
  priceMax?: number;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
}
