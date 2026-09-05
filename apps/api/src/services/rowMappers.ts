import type {
  BikeCardDto,
  BikeDetailDto,
  BikeSpecsDto,
  MarketPriceDto,
  PriceDto,
} from '../types.js';

/**
 * The joined bike row every query in this service selects. Postgres lower-cases
 * unquoted identifiers, so these are the snake_case column names as they come
 * back from the driver.
 */
export interface BikeRow {
  bike_id: number;
  slug: string;
  name: string;
  brand_name: string;
  brand_slug: string;
  class_name: string;
  model_year: number;
  price_amount: number | string | null;
  price_currency: string | null;
  price_market: string | null;
  price_text: string | null;
  price_is_approximate: boolean | null;
  image_url: string | null;
  variants: string | null;
  notes: string | null;
  flags: string | null;
  source_url: string | null;
  price_source_url: string | null;
  data_generated_at: string | Date | null;
  engine: string | null;
  displacement_cc: number | string | null;
  bore_stroke_mm: string | null;
  compression: string | null;
  power_hp: number | string | null;
  power_kw: number | string | null;
  power_rpm: number | null;
  torque_nm: number | string | null;
  torque_rpm: number | null;
  fuel_system: string | null;
  transmission: string | null;
  clutch: string | null;
  final_drive: string | null;
  frame: string | null;
  front_suspension: string | null;
  rear_suspension: string | null;
  brake_front: string | null;
  brake_rear: string | null;
  tyre_front: string | null;
  tyre_rear: string | null;
  wheelbase_mm: number | null;
  seat_height_mm: number | null;
  ground_clearance_mm: number | null;
  kerb_weight_kg: number | string | null;
  fuel_tank_l: number | string | null;
  fuel_economy: string | null;
  battery_kwh: number | string | null;
  range_km: number | null;
  charging: string | null;
  rider_aids: string | null;
  display: string | null;
}

/** NUMERIC is parsed at the driver, but a stray string should still not leak out. */
function num(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** DATE arrives as a plain `YYYY-MM-DD`; a Date would drag a timezone along. */
function isoDay(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}

function toPrice(row: BikeRow): PriceDto | null {
  if (row.price_text === null && row.price_amount === null) return null;
  return {
    amount: num(row.price_amount),
    currency: row.price_currency?.trim() ?? null,
    market: row.price_market?.trim() ?? null,
    text: row.price_text,
    isApproximate: Boolean(row.price_is_approximate),
  };
}

export function toBikeCard(row: BikeRow): BikeCardDto {
  return {
    id: row.bike_id,
    slug: row.slug,
    name: row.name,
    brand: row.brand_name,
    class: row.class_name,
    // Null, not zero — an unpublished figure is not a figure of nought.
    cc: num(row.displacement_cc),
    hp: num(row.power_hp),
    kg: num(row.kerb_weight_kg),
    price: toPrice(row),
    imageUrl: row.image_url,
    flags: row.flags,
    dataGeneratedAt: isoDay(row.data_generated_at),
  };
}

export function toBikeSpecs(row: BikeRow): BikeSpecsDto {
  return {
    engine: row.engine,
    displacementCc: num(row.displacement_cc),
    boreStrokeMm: row.bore_stroke_mm,
    compression: row.compression,
    powerHp: num(row.power_hp),
    powerKw: num(row.power_kw),
    powerRpm: row.power_rpm,
    torqueNm: num(row.torque_nm),
    torqueRpm: row.torque_rpm,
    fuelSystem: row.fuel_system,
    transmission: row.transmission,
    clutch: row.clutch,
    finalDrive: row.final_drive,
    frame: row.frame,
    frontSuspension: row.front_suspension,
    rearSuspension: row.rear_suspension,
    brakeFront: row.brake_front,
    brakeRear: row.brake_rear,
    tyreFront: row.tyre_front,
    tyreRear: row.tyre_rear,
    wheelbaseMm: row.wheelbase_mm,
    seatHeightMm: row.seat_height_mm,
    groundClearanceMm: row.ground_clearance_mm,
    kerbWeightKg: num(row.kerb_weight_kg),
    fuelTankL: num(row.fuel_tank_l),
    fuelEconomy: row.fuel_economy,
    batteryKwh: num(row.battery_kwh),
    rangeKm: row.range_km,
    charging: row.charging,
    riderAids: row.rider_aids,
    display: row.display,
  };
}

export function toBikeDetail(
  row: BikeRow,
  markets: string[] = [],
  otherPrices: MarketPriceDto[] = [],
): BikeDetailDto {
  return {
    id: row.bike_id,
    slug: row.slug,
    name: row.name,
    brand: row.brand_name,
    brandSlug: row.brand_slug,
    class: row.class_name,
    modelYear: row.model_year,
    price: toPrice(row),
    imageUrl: row.image_url,
    markets,
    otherPrices,
    variants: row.variants,
    notes: row.notes,
    flags: row.flags,
    sourceUrl: row.source_url,
    priceSourceUrl: row.price_source_url,
    dataGeneratedAt: isoDay(row.data_generated_at),
    specs: toBikeSpecs(row),
  };
}

/** Selected by every bike query so one mapper covers them all. */
export const BIKE_COLUMNS = `
  b.bike_id, b.slug, b.name, b.model_year, b.image_url,
  b.price_amount, b.price_currency, b.price_market, b.price_text, b.price_is_approximate,
  b.variants, b.notes, b.flags, b.source_url, b.price_source_url, b.data_generated_at,
  br.name AS brand_name, br.slug AS brand_slug,
  c.name AS class_name,
  s.engine, s.displacement_cc, s.bore_stroke_mm, s.compression, s.power_hp, s.power_kw,
  s.power_rpm, s.torque_nm, s.torque_rpm, s.fuel_system, s.transmission, s.clutch,
  s.final_drive, s.frame, s.front_suspension, s.rear_suspension, s.brake_front,
  s.brake_rear, s.tyre_front, s.tyre_rear, s.wheelbase_mm, s.seat_height_mm,
  s.ground_clearance_mm, s.kerb_weight_kg, s.fuel_tank_l, s.fuel_economy, s.battery_kwh,
  s.range_km, s.charging, s.rider_aids, s.display
`;

export const BIKE_JOINS = `
  FROM bikes b
  INNER JOIN brands br ON br.brand_id = b.brand_id
  INNER JOIN bike_classes c ON c.class_id = b.class_id
  LEFT JOIN bike_specs s ON s.bike_id = b.bike_id
`;
