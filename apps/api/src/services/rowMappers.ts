import type {
  BikeCardDto,
  BikeDetailDto,
  BikeSpecsDto,
  MarketPriceDto,
  PriceDto,
} from '../types.js';

/** Shape of the joined bike rows every query in this service selects. */
export interface BikeRow {
  BikeId: number;
  Slug: string;
  Name: string;
  BrandName: string;
  BrandSlug: string;
  ClassName: string;
  ModelYear: number;
  PriceAmount: number | string | null;
  PriceCurrency: string | null;
  PriceMarket: string | null;
  PriceText: string | null;
  PriceIsApproximate: boolean | number | null;
  ImageUrl: string | null;
  Variants: string | null;
  Notes: string | null;
  Flags: string | null;
  SourceUrl: string | null;
  PriceSourceUrl: string | null;
  Engine: string | null;
  DisplacementCc: number | string | null;
  BoreStrokeMm: string | null;
  Compression: string | null;
  PowerHp: number | string | null;
  PowerKw: number | string | null;
  PowerRpm: number | null;
  TorqueNm: number | string | null;
  TorqueRpm: number | null;
  FuelSystem: string | null;
  Transmission: string | null;
  Clutch: string | null;
  FinalDrive: string | null;
  Frame: string | null;
  FrontSuspension: string | null;
  RearSuspension: string | null;
  BrakeFront: string | null;
  BrakeRear: string | null;
  TyreFront: string | null;
  TyreRear: string | null;
  WheelbaseMm: number | null;
  SeatHeightMm: number | null;
  GroundClearanceMm: number | null;
  KerbWeightKg: number | string | null;
  FuelTankL: number | string | null;
  FuelEconomy: string | null;
  BatteryKwh: number | string | null;
  RangeKm: number | null;
  Charging: string | null;
  RiderAids: string | null;
  Display: string | null;
}

/** mssql returns DECIMAL as a string on some drivers; normalise to number|null. */
function num(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toPrice(row: BikeRow): PriceDto | null {
  if (row.PriceText === null && row.PriceAmount === null) return null;

  return {
    amount: num(row.PriceAmount),
    currency: row.PriceCurrency?.trim() ?? null,
    market: row.PriceMarket?.trim() ?? null,
    text: row.PriceText,
    isApproximate: Boolean(row.PriceIsApproximate),
  };
}

export function toBikeCard(row: BikeRow): BikeCardDto {
  return {
    id: row.BikeId,
    slug: row.Slug,
    name: row.Name,
    brand: row.BrandName,
    class: row.ClassName,
    // Null, not zero — an unpublished figure is not a figure of nought.
    cc: num(row.DisplacementCc),
    hp: num(row.PowerHp),
    kg: num(row.KerbWeightKg),
    price: toPrice(row),
    imageUrl: row.ImageUrl,
  };
}

export function toBikeSpecs(row: BikeRow): BikeSpecsDto {
  return {
    engine: row.Engine,
    displacementCc: num(row.DisplacementCc),
    boreStrokeMm: row.BoreStrokeMm,
    compression: row.Compression,
    powerHp: num(row.PowerHp),
    powerKw: num(row.PowerKw),
    powerRpm: row.PowerRpm,
    torqueNm: num(row.TorqueNm),
    torqueRpm: row.TorqueRpm,
    fuelSystem: row.FuelSystem,
    transmission: row.Transmission,
    clutch: row.Clutch,
    finalDrive: row.FinalDrive,
    frame: row.Frame,
    frontSuspension: row.FrontSuspension,
    rearSuspension: row.RearSuspension,
    brakeFront: row.BrakeFront,
    brakeRear: row.BrakeRear,
    tyreFront: row.TyreFront,
    tyreRear: row.TyreRear,
    wheelbaseMm: row.WheelbaseMm,
    seatHeightMm: row.SeatHeightMm,
    groundClearanceMm: row.GroundClearanceMm,
    kerbWeightKg: num(row.KerbWeightKg),
    fuelTankL: num(row.FuelTankL),
    fuelEconomy: row.FuelEconomy,
    batteryKwh: num(row.BatteryKwh),
    rangeKm: row.RangeKm,
    charging: row.Charging,
    riderAids: row.RiderAids,
    display: row.Display,
  };
}

export function toBikeDetail(
  row: BikeRow,
  markets: string[] = [],
  otherPrices: MarketPriceDto[] = [],
): BikeDetailDto {
  return {
    id: row.BikeId,
    slug: row.Slug,
    name: row.Name,
    brand: row.BrandName,
    brandSlug: row.BrandSlug,
    class: row.ClassName,
    modelYear: row.ModelYear,
    price: toPrice(row),
    imageUrl: row.ImageUrl,
    markets,
    otherPrices,
    variants: row.Variants,
    notes: row.Notes,
    flags: row.Flags,
    sourceUrl: row.SourceUrl,
    priceSourceUrl: row.PriceSourceUrl,
    specs: toBikeSpecs(row),
  };
}

/** Selected by every bike query so one mapper covers them all. */
export const BIKE_COLUMNS = `
  b.BikeId, b.Slug, b.Name, b.ModelYear, b.ImageUrl,
  b.PriceAmount, b.PriceCurrency, b.PriceMarket, b.PriceText, b.PriceIsApproximate,
  b.Variants, b.Notes, b.Flags, b.SourceUrl, b.PriceSourceUrl,
  br.Name AS BrandName, br.Slug AS BrandSlug,
  c.Name AS ClassName,
  s.Engine, s.DisplacementCc, s.BoreStrokeMm, s.Compression, s.PowerHp, s.PowerKw,
  s.PowerRpm, s.TorqueNm, s.TorqueRpm, s.FuelSystem, s.Transmission, s.Clutch,
  s.FinalDrive, s.Frame, s.FrontSuspension, s.RearSuspension, s.BrakeFront,
  s.BrakeRear, s.TyreFront, s.TyreRear, s.WheelbaseMm, s.SeatHeightMm,
  s.GroundClearanceMm, s.KerbWeightKg, s.FuelTankL, s.FuelEconomy, s.BatteryKwh,
  s.RangeKm, s.Charging, s.RiderAids, s.Display
`;

export const BIKE_JOINS = `
  FROM Bikes b
  INNER JOIN Brands br ON br.BrandId = b.BrandId
  INNER JOIN BikeClasses c ON c.ClassId = b.ClassId
  LEFT JOIN BikeSpecs s ON s.BikeId = b.BikeId
`;
