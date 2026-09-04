export interface BrandDto {
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

export interface BikeSpecsDto {
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

export interface BikeDetailDto {
  id: number;
  slug: string;
  name: string;
  brand: string;
  brandSlug: string;
  class: string;
  modelYear: number;
  priceUsd: number;
  imageUrl: string | null;
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
