import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import type { Pool } from 'pg';
import { closePool, getPool } from '../db/pool.js';
import { parsePriceText, slugify } from '../db/priceText.js';
import { logger } from '../logger.js';

const dbDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'db');
const seedDir = join(dbDir, 'seed');

/**
 * A manufacturer catalogue file: `{ brand, market, models[] }`, one per brand
 * per market. Every spec field is optional so a partial sheet still imports;
 * unknown extra fields are ignored rather than rejected.
 */
const modelSchema = z
  .object({
    model: z.string().min(1).max(120),
    model_year: z.coerce.number().int().min(1900).max(2100),
    category: z.string().min(1).max(40),
    markets: z.array(z.string().min(1).max(8)).optional(),

    engine: z.string().nullish(),
    displacement: z.number().nullish(),
    bore_stroke_mm: z.string().nullish(),
    compression: z.string().nullish(),
    power_hp: z.number().nullish(),
    power_kw: z.number().nullish(),
    power_rpm: z.number().int().nullish(),
    torque_nm: z.number().nullish(),
    torque_rpm: z.number().int().nullish(),
    fuel_system: z.string().nullish(),
    transmission: z.string().nullish(),
    clutch: z.string().nullish(),
    final_drive: z.string().nullish(),
    frame: z.string().nullish(),
    susp_f: z.string().nullish(),
    susp_r: z.string().nullish(),
    brake_f: z.string().nullish(),
    brake_r: z.string().nullish(),
    tyre_f: z.string().nullish(),
    tyre_r: z.string().nullish(),
    wheelbase_mm: z.number().int().nullish(),
    seat_height_mm: z.number().int().nullish(),
    ground_clearance_mm: z.number().int().nullish(),
    weight_kg: z.number().nullish(),
    fuel_l: z.number().nullish(),
    wmtc: z.string().nullish(),
    battery_kwh: z.number().nullish(),
    range_km: z.number().int().nullish(),
    charging: z.string().nullish(),
    rider_aids: z.string().nullish(),
    display: z.string().nullish(),

    variants: z.array(z.string()).nullish(),
    notes: z.string().nullish(),
    flags: z.string().nullish(),
    source: z.string().nullish(),
    /** Where the price came from, when that differs from the spec source. */
    price_source: z.string().nullish(),

    /** Optional artwork; a path under apps/web/public or an absolute URL. */
    image: z.string().nullish(),
    image_url: z.string().nullish(),

    msrp_thb: z.string().nullish(),
    msrp_other: z.record(z.string()).nullish(),
  })
  .passthrough();

const catalogueSchema = z
  .object({
    brand: z.string().min(1).max(80),
    /** Free text, e.g. "Thailand (Thai Honda Manufacturing)". */
    market: z.string().nullish(),
    /** When the catalogue was compiled — the site shows this as "specs as of". */
    generated: z.string().nullish(),
    brand_country_code: z.string().length(2).nullish(),
    models: z.array(modelSchema).min(1),
  })
  .passthrough();

type Catalogue = z.infer<typeof catalogueSchema>;
type Model = z.infer<typeof modelSchema>;

/**
 * Country of the manufacturer's head office. Only used when a catalogue file
 * does not state `brand_country_code` itself.
 */
const BRAND_COUNTRY: Record<string, string> = {
  honda: 'JP',
  yamaha: 'JP',
  kawasaki: 'JP',
  suzuki: 'JP',
  ducati: 'IT',
  aprilia: 'IT',
  'moto guzzi': 'IT',
  'mv agusta': 'IT',
  bmw: 'DE',
  'bmw motorrad': 'DE',
  triumph: 'GB',
  ktm: 'AT',
  husqvarna: 'AT',
  'royal enfield': 'IN',
  bajaj: 'IN',
  tvs: 'IN',
  'harley-davidson': 'US',
  indian: 'US',
  'can-am': 'CA',
  cfmoto: 'CN',
  gpx: 'TH',
  vespa: 'IT',
  piaggio: 'IT',
  benelli: 'CN',
  'zontes': 'CN',
};

/** `msrp_thb` names its own market and currency; other prices are keyed by market. */
const PRICE_FIELD_MARKET = 'TH';

async function clearCatalogue(pool: Pool): Promise<void> {
  // bike_specs, bike_markets and bike_prices cascade from bikes.
  await pool.query('TRUNCATE bikes, brands RESTART IDENTITY CASCADE');
  logger.warn('cleared every brand and bike before importing');
}

async function seedClasses(pool: Pool): Promise<void> {
  const script = await readFile(join(dbDir, 'seed.sql'), 'utf8');
  await pool.query(script);
}

async function upsertBrand(pool: Pool, catalogue: Catalogue): Promise<number> {
  const name = catalogue.brand;
  const slug = slugify(name);
  const countryCode =
    catalogue.brand_country_code?.toUpperCase() ?? BRAND_COUNTRY[name.toLowerCase()] ?? null;

  const result = await pool.query<{ brand_id: number }>(
    `INSERT INTO brands (name, country_code, slug)
     VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, country_code = EXCLUDED.country_code
     RETURNING brand_id`,
    [name, countryCode, slug],
  );

  const row = result.rows[0];
  if (!row) throw new Error(`Could not resolve brand_id for ${slug}`);
  return row.brand_id;
}

async function resolveClassId(pool: Pool, name: string): Promise<number> {
  // DO NOTHING skips the RETURNING row, so read it back either way.
  await pool.query('INSERT INTO bike_classes (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [
    name,
  ]);
  const result = await pool.query<{ class_id: number }>(
    'SELECT class_id FROM bike_classes WHERE name = $1',
    [name],
  );
  const row = result.rows[0];
  if (!row) throw new Error(`Could not resolve class_id for ${name}`);
  return row.class_id;
}

async function upsertBike(
  pool: Pool,
  model: Model,
  brandName: string,
  brandId: number,
  classId: number,
  generatedAt: string | null,
): Promise<number> {
  const slug = slugify(brandName, model.model);
  const price = parsePriceText(model.msrp_thb);

  const result = await pool.query<{ bike_id: number }>(
    `INSERT INTO bikes (brand_id, class_id, name, slug, model_year, price_amount,
                        price_currency, price_market, price_text, price_is_approximate,
                        image_url, variants, notes, flags, source_url, price_source_url,
                        data_generated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     ON CONFLICT (slug) DO UPDATE SET
       brand_id = EXCLUDED.brand_id, class_id = EXCLUDED.class_id, name = EXCLUDED.name,
       model_year = EXCLUDED.model_year, price_amount = EXCLUDED.price_amount,
       price_currency = EXCLUDED.price_currency, price_market = EXCLUDED.price_market,
       price_text = EXCLUDED.price_text, price_is_approximate = EXCLUDED.price_is_approximate,
       image_url = EXCLUDED.image_url, variants = EXCLUDED.variants, notes = EXCLUDED.notes,
       flags = EXCLUDED.flags, source_url = EXCLUDED.source_url,
       price_source_url = EXCLUDED.price_source_url,
       data_generated_at = EXCLUDED.data_generated_at
     RETURNING bike_id`,
    [
      brandId, classId, model.model, slug, model.model_year,
      price?.amount ?? null, price?.currency ?? null, price ? PRICE_FIELD_MARKET : null,
      price?.text ?? null, price?.isApproximate ?? false,
      model.image ?? model.image_url ?? null, model.variants?.join(', ') ?? null,
      model.notes ?? null, model.flags ?? null, model.source ?? null,
      model.price_source ?? null, generatedAt,
    ],
  );

  const row = result.rows[0];
  if (!row) throw new Error(`Could not resolve bike_id for ${slug}`);
  return row.bike_id;
}

async function upsertSpecs(pool: Pool, bikeId: number, model: Model): Promise<void> {
  await pool.query(
    `INSERT INTO bike_specs (bike_id, engine, displacement_cc, bore_stroke_mm, compression,
        power_hp, power_kw, power_rpm, torque_nm, torque_rpm, fuel_system, transmission,
        clutch, final_drive, frame, front_suspension, rear_suspension, brake_front,
        brake_rear, tyre_front, tyre_rear, wheelbase_mm, seat_height_mm,
        ground_clearance_mm, kerb_weight_kg, fuel_tank_l, fuel_economy, battery_kwh,
        range_km, charging, rider_aids, display)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
             $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32)
     ON CONFLICT (bike_id) DO UPDATE SET
       engine = EXCLUDED.engine, displacement_cc = EXCLUDED.displacement_cc,
       bore_stroke_mm = EXCLUDED.bore_stroke_mm, compression = EXCLUDED.compression,
       power_hp = EXCLUDED.power_hp, power_kw = EXCLUDED.power_kw,
       power_rpm = EXCLUDED.power_rpm, torque_nm = EXCLUDED.torque_nm,
       torque_rpm = EXCLUDED.torque_rpm, fuel_system = EXCLUDED.fuel_system,
       transmission = EXCLUDED.transmission, clutch = EXCLUDED.clutch,
       final_drive = EXCLUDED.final_drive, frame = EXCLUDED.frame,
       front_suspension = EXCLUDED.front_suspension, rear_suspension = EXCLUDED.rear_suspension,
       brake_front = EXCLUDED.brake_front, brake_rear = EXCLUDED.brake_rear,
       tyre_front = EXCLUDED.tyre_front, tyre_rear = EXCLUDED.tyre_rear,
       wheelbase_mm = EXCLUDED.wheelbase_mm, seat_height_mm = EXCLUDED.seat_height_mm,
       ground_clearance_mm = EXCLUDED.ground_clearance_mm,
       kerb_weight_kg = EXCLUDED.kerb_weight_kg, fuel_tank_l = EXCLUDED.fuel_tank_l,
       fuel_economy = EXCLUDED.fuel_economy, battery_kwh = EXCLUDED.battery_kwh,
       range_km = EXCLUDED.range_km, charging = EXCLUDED.charging,
       rider_aids = EXCLUDED.rider_aids, display = EXCLUDED.display`,
    [
      bikeId, model.engine ?? null, model.displacement ?? null, model.bore_stroke_mm ?? null,
      model.compression ?? null, model.power_hp ?? null, model.power_kw ?? null,
      model.power_rpm ?? null, model.torque_nm ?? null, model.torque_rpm ?? null,
      model.fuel_system ?? null, model.transmission ?? null, model.clutch ?? null,
      model.final_drive ?? null, model.frame ?? null, model.susp_f ?? null,
      model.susp_r ?? null, model.brake_f ?? null, model.brake_r ?? null,
      model.tyre_f ?? null, model.tyre_r ?? null, model.wheelbase_mm ?? null,
      model.seat_height_mm ?? null, model.ground_clearance_mm ?? null,
      model.weight_kg ?? null, model.fuel_l ?? null, model.wmtc ?? null,
      model.battery_kwh ?? null, model.range_km ?? null, model.charging ?? null,
      model.rider_aids ?? null, model.display ?? null,
    ],
  );
}

async function replaceMarkets(pool: Pool, bikeId: number, markets: string[]): Promise<void> {
  await pool.query('DELETE FROM bike_markets WHERE bike_id = $1', [bikeId]);
  const codes = [...new Set(markets.map((m) => m.toUpperCase()))];
  if (codes.length === 0) return;
  await pool.query(
    'INSERT INTO bike_markets (bike_id, market_code) SELECT $1, unnest($2::text[])',
    [bikeId, codes],
  );
}

async function replaceOtherPrices(
  pool: Pool,
  bikeId: number,
  prices: Record<string, string> | null | undefined,
): Promise<void> {
  await pool.query('DELETE FROM bike_prices WHERE bike_id = $1', [bikeId]);
  if (!prices) return;

  for (const [market, raw] of Object.entries(prices)) {
    const parsed = parsePriceText(raw);
    if (!parsed) continue;
    await pool.query(
      `INSERT INTO bike_prices (bike_id, market_code, currency, amount, raw_text)
       VALUES ($1, $2, $3, $4, $5)`,
      [bikeId, market.toUpperCase(), parsed.currency, parsed.amount, parsed.text],
    );
  }
}

async function run(): Promise<void> {
  const fresh = process.argv.includes('--fresh');
  const pool = getPool();

  if (fresh) await clearCatalogue(pool);
  await seedClasses(pool);

  const files = (await readdir(seedDir)).filter((file) => file.endsWith('.json')).sort();
  if (files.length === 0) {
    logger.warn({ seedDir }, 'no catalogue files found — nothing to import');
    return;
  }

  let bikeCount = 0;

  for (const file of files) {
    const raw = JSON.parse(await readFile(join(seedDir, file), 'utf8')) as unknown;
    const parsed = catalogueSchema.safeParse(raw);

    if (!parsed.success) {
      logger.error({ file, issues: parsed.error.issues.slice(0, 10) }, 'malformed catalogue file');
      throw new Error(`${file} does not match the catalogue schema`);
    }

    const catalogue = parsed.data;
    const brandId = await upsertBrand(pool, catalogue);

    for (const model of catalogue.models) {
      const classId = await resolveClassId(pool, model.category);
      const bikeId = await upsertBike(
        pool, model, catalogue.brand, brandId, classId, catalogue.generated ?? null,
      );
      await upsertSpecs(pool, bikeId, model);
      await replaceMarkets(pool, bikeId, model.markets ?? []);
      await replaceOtherPrices(pool, bikeId, model.msrp_other);
      bikeCount += 1;
    }

    logger.info(
      { file, brand: catalogue.brand, market: catalogue.market, models: catalogue.models.length },
      'imported catalogue',
    );
  }

  logger.info({ files: files.length, models: bikeCount }, 'seed complete');
}

run()
  .then(() => closePool())
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error({ error }, 'seed failed');
    process.exit(1);
  });
