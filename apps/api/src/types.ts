export interface BrandDto {
  id: number;
  name: string;
  countryCode: string | null;
  slug: string;
  modelCount: number;
}

export interface ClassDto {
  name: string;
  modelCount: number;
}

/**
 * A published price. `text` is the source string and is what should be shown —
 * real list prices carry qualifiers ("THB 69,900 / 79,900", "THB ~249,000 (SP)").
 * `amount` is the base figure parsed out of it, for sorting only, and is null
 * when it could not be trusted.
 */
export interface PriceDto {
  amount: number | null;
  currency: string | null;
  market: string | null;
  text: string | null;
  isApproximate: boolean;
}

export interface MarketPriceDto {
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
  /** Null wherever the manufacturer sheet does not publish a figure. */
  cc: number | null;
  hp: number | null;
  kg: number | null;
  price: PriceDto | null;
  imageUrl: string | null;
}

export interface BikeSpecsDto {
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

export interface BikeDetailDto {
  id: number;
  slug: string;
  name: string;
  brand: string;
  brandSlug: string;
  class: string;
  modelYear: number;
  price: PriceDto | null;
  imageUrl: string | null;
  /** Market codes the model is sold in, e.g. ["TH", "EU"]. */
  markets: string[];
  otherPrices: MarketPriceDto[];
  variants: string | null;
  notes: string | null;
  /** Source caveats worth showing rather than hiding. */
  flags: string | null;
  sourceUrl: string | null;
  /** Where the price came from, when that is not the manufacturer's own sheet. */
  priceSourceUrl: string | null;
  specs: BikeSpecsDto;
}

export interface BikeListDto {
  items: BikeCardDto[];
  total: number;
  page: number;
  pageSize: number;
}

/** field name -> winning BikeId. */
export type WinnersDto = Record<string, number>;

export interface CompareDto {
  bikes: BikeDetailDto[];
  winners: WinnersDto;
}

export interface SearchHitDto {
  id: number;
  name: string;
  brand: string;
  slug: string;
}
