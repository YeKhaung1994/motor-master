import type { BikeCardDto, BikeDetailDto, BikeSpecsDto } from '../types.js';

/** Shape of the joined bike rows every query in this service selects. */
export interface BikeRow {
  BikeId: number;
  Slug: string;
  Name: string;
  BrandName: string;
  BrandSlug: string;
  ClassName: string;
  ModelYear: number;
  PriceUsd: number;
  ImageUrl: string | null;
  Engine: string | null;
  DisplacementCc: number | null;
  PowerHp: number | null;
  TorqueNm: number | null;
  Transmission: string | null;
  FrontSuspension: string | null;
  RearSuspension: string | null;
  Brakes: string | null;
  Tyres: string | null;
  WheelbaseMm: number | null;
  KerbWeightKg: number | null;
  SeatHeightMm: number | null;
  FuelTankL: number | null;
  RiderAids: string | null;
  Display: string | null;
}

/** mssql returns DECIMAL as a string on some drivers; normalise to number|null. */
function num(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toBikeCard(row: BikeRow): BikeCardDto {
  return {
    id: row.BikeId,
    slug: row.Slug,
    name: row.Name,
    brand: row.BrandName,
    class: row.ClassName,
    cc: num(row.DisplacementCc) ?? 0,
    hp: num(row.PowerHp) ?? 0,
    kg: num(row.KerbWeightKg) ?? 0,
    priceUsd: num(row.PriceUsd) ?? 0,
    imageUrl: row.ImageUrl,
  };
}

export function toBikeSpecs(row: BikeRow): BikeSpecsDto {
  return {
    engine: row.Engine,
    displacementCc: num(row.DisplacementCc),
    powerHp: num(row.PowerHp),
    torqueNm: num(row.TorqueNm),
    transmission: row.Transmission,
    frontSuspension: row.FrontSuspension,
    rearSuspension: row.RearSuspension,
    brakes: row.Brakes,
    tyres: row.Tyres,
    wheelbaseMm: num(row.WheelbaseMm),
    kerbWeightKg: num(row.KerbWeightKg),
    seatHeightMm: num(row.SeatHeightMm),
    fuelTankL: num(row.FuelTankL),
    riderAids: row.RiderAids,
    display: row.Display,
  };
}

export function toBikeDetail(row: BikeRow): BikeDetailDto {
  return {
    id: row.BikeId,
    slug: row.Slug,
    name: row.Name,
    brand: row.BrandName,
    brandSlug: row.BrandSlug,
    class: row.ClassName,
    modelYear: row.ModelYear,
    priceUsd: num(row.PriceUsd) ?? 0,
    imageUrl: row.ImageUrl,
    specs: toBikeSpecs(row),
  };
}

/** Selected by every bike query so one mapper covers them all. */
export const BIKE_COLUMNS = `
  b.BikeId, b.Slug, b.Name, b.ModelYear, b.PriceUsd, b.ImageUrl,
  br.Name AS BrandName, br.Slug AS BrandSlug,
  c.Name AS ClassName,
  s.Engine, s.DisplacementCc, s.PowerHp, s.TorqueNm, s.Transmission,
  s.FrontSuspension, s.RearSuspension, s.Brakes, s.Tyres, s.WheelbaseMm,
  s.KerbWeightKg, s.SeatHeightMm, s.FuelTankL, s.RiderAids, s.Display
`;

export const BIKE_JOINS = `
  FROM Bikes b
  INNER JOIN Brands br ON br.BrandId = b.BrandId
  INNER JOIN BikeClasses c ON c.ClassId = b.ClassId
  LEFT JOIN BikeSpecs s ON s.BikeId = b.BikeId
`;
