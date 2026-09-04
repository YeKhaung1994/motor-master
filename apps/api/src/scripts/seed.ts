import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { getPool, sql, closePool } from '../db/pool.js';
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

async function clearCatalogue(pool: sql.ConnectionPool): Promise<void> {
  // BikeMarkets, BikePrices and BikeSpecs cascade from Bikes.
  await pool.request().batch(`
    DELETE FROM Bikes;
    DELETE FROM Brands;
    DBCC CHECKIDENT ('Bikes', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('Brands', RESEED, 0) WITH NO_INFOMSGS;
  `);
  logger.warn('cleared every brand and bike before importing');
}

async function seedClasses(pool: sql.ConnectionPool): Promise<void> {
  const script = await readFile(join(dbDir, 'seed.sql'), 'utf8');
  await pool.request().batch(script);
}

async function upsertBrand(pool: sql.ConnectionPool, catalogue: Catalogue): Promise<number> {
  const name = catalogue.brand;
  const slug = slugify(name);
  const countryCode =
    catalogue.brand_country_code?.toUpperCase() ?? BRAND_COUNTRY[name.toLowerCase()] ?? null;

  const result = await pool
    .request()
    .input('name', sql.NVarChar(80), name)
    .input('countryCode', sql.Char(2), countryCode)
    .input('slug', sql.NVarChar(80), slug)
    .query<{ BrandId: number }>(`
      MERGE Brands AS target
      USING (SELECT @slug AS Slug) AS source
        ON target.Slug = source.Slug
      WHEN MATCHED THEN
        UPDATE SET Name = @name, CountryCode = @countryCode
      WHEN NOT MATCHED THEN
        INSERT (Name, CountryCode, Slug) VALUES (@name, @countryCode, @slug);

      SELECT BrandId FROM Brands WHERE Slug = @slug;
    `);

  const row = result.recordset[0];
  if (!row) throw new Error(`Could not resolve BrandId for ${slug}`);
  return row.BrandId;
}

async function resolveClassId(pool: sql.ConnectionPool, name: string): Promise<number> {
  const result = await pool
    .request()
    .input('name', sql.NVarChar(40), name)
    .query<{ ClassId: number }>(`
      IF NOT EXISTS (SELECT 1 FROM BikeClasses WHERE Name = @name)
        INSERT INTO BikeClasses (Name) VALUES (@name);

      SELECT ClassId FROM BikeClasses WHERE Name = @name;
    `);

  const row = result.recordset[0];
  if (!row) throw new Error(`Could not resolve ClassId for ${name}`);
  return row.ClassId;
}

async function upsertBike(
  pool: sql.ConnectionPool,
  model: Model,
  brandName: string,
  brandId: number,
  classId: number,
): Promise<number> {
  const slug = slugify(brandName, model.model);
  const price = parsePriceText(model.msrp_thb);

  const result = await pool
    .request()
    .input('brandId', sql.Int, brandId)
    .input('classId', sql.Int, classId)
    .input('name', sql.NVarChar(120), model.model)
    .input('slug', sql.NVarChar(140), slug)
    .input('modelYear', sql.SmallInt, model.model_year)
    .input('priceAmount', sql.Decimal(12, 2), price?.amount ?? null)
    .input('priceCurrency', sql.Char(3), price?.currency ?? null)
    .input('priceMarket', sql.NVarChar(8), price ? PRICE_FIELD_MARKET : null)
    .input('priceText', sql.NVarChar(200), price?.text ?? null)
    .input('priceApprox', sql.Bit, price?.isApproximate ?? false)
    .input('imageUrl', sql.NVarChar(400), model.image ?? model.image_url ?? null)
    .input('variants', sql.NVarChar(300), model.variants?.join(', ') ?? null)
    .input('notes', sql.NVarChar(400), model.notes ?? null)
    .input('flags', sql.NVarChar(400), model.flags ?? null)
    .input('sourceUrl', sql.NVarChar(400), model.source ?? null)
    .input('priceSourceUrl', sql.NVarChar(400), model.price_source ?? null)
    .query<{ BikeId: number }>(`
      MERGE Bikes AS target
      USING (SELECT @slug AS Slug) AS source
        ON target.Slug = source.Slug
      WHEN MATCHED THEN
        UPDATE SET BrandId = @brandId, ClassId = @classId, Name = @name,
                   ModelYear = @modelYear, PriceAmount = @priceAmount,
                   PriceCurrency = @priceCurrency, PriceMarket = @priceMarket,
                   PriceText = @priceText, PriceIsApproximate = @priceApprox,
                   ImageUrl = @imageUrl, Variants = @variants, Notes = @notes,
                   Flags = @flags, SourceUrl = @sourceUrl, PriceSourceUrl = @priceSourceUrl
      WHEN NOT MATCHED THEN
        INSERT (BrandId, ClassId, Name, Slug, ModelYear, PriceAmount, PriceCurrency,
                PriceMarket, PriceText, PriceIsApproximate, ImageUrl, Variants,
                Notes, Flags, SourceUrl, PriceSourceUrl)
        VALUES (@brandId, @classId, @name, @slug, @modelYear, @priceAmount, @priceCurrency,
                @priceMarket, @priceText, @priceApprox, @imageUrl, @variants,
                @notes, @flags, @sourceUrl, @priceSourceUrl);

      SELECT BikeId FROM Bikes WHERE Slug = @slug;
    `);

  const row = result.recordset[0];
  if (!row) throw new Error(`Could not resolve BikeId for ${slug}`);
  return row.BikeId;
}

async function upsertSpecs(pool: sql.ConnectionPool, bikeId: number, model: Model): Promise<void> {
  await pool
    .request()
    .input('bikeId', sql.Int, bikeId)
    .input('engine', sql.NVarChar(200), model.engine ?? null)
    .input('displacementCc', sql.Decimal(7, 1), model.displacement ?? null)
    .input('boreStrokeMm', sql.NVarChar(40), model.bore_stroke_mm ?? null)
    .input('compression', sql.NVarChar(20), model.compression ?? null)
    .input('powerHp', sql.Decimal(6, 1), model.power_hp ?? null)
    .input('powerKw', sql.Decimal(6, 1), model.power_kw ?? null)
    .input('powerRpm', sql.Int, model.power_rpm ?? null)
    .input('torqueNm', sql.Decimal(6, 1), model.torque_nm ?? null)
    .input('torqueRpm', sql.Int, model.torque_rpm ?? null)
    .input('fuelSystem', sql.NVarChar(120), model.fuel_system ?? null)
    .input('transmission', sql.NVarChar(120), model.transmission ?? null)
    .input('clutch', sql.NVarChar(120), model.clutch ?? null)
    .input('finalDrive', sql.NVarChar(40), model.final_drive ?? null)
    .input('frame', sql.NVarChar(120), model.frame ?? null)
    .input('frontSuspension', sql.NVarChar(200), model.susp_f ?? null)
    .input('rearSuspension', sql.NVarChar(200), model.susp_r ?? null)
    .input('brakeFront', sql.NVarChar(200), model.brake_f ?? null)
    .input('brakeRear', sql.NVarChar(200), model.brake_r ?? null)
    .input('tyreFront', sql.NVarChar(60), model.tyre_f ?? null)
    .input('tyreRear', sql.NVarChar(60), model.tyre_r ?? null)
    .input('wheelbaseMm', sql.Int, model.wheelbase_mm ?? null)
    .input('seatHeightMm', sql.Int, model.seat_height_mm ?? null)
    .input('groundClearanceMm', sql.Int, model.ground_clearance_mm ?? null)
    .input('kerbWeightKg', sql.Decimal(6, 1), model.weight_kg ?? null)
    .input('fuelTankL', sql.Decimal(5, 1), model.fuel_l ?? null)
    .input('fuelEconomy', sql.NVarChar(40), model.wmtc ?? null)
    .input('batteryKwh', sql.Decimal(6, 2), model.battery_kwh ?? null)
    .input('rangeKm', sql.Int, model.range_km ?? null)
    .input('charging', sql.NVarChar(200), model.charging ?? null)
    .input('riderAids', sql.NVarChar(200), model.rider_aids ?? null)
    .input('display', sql.NVarChar(80), model.display ?? null)
    .query(`
      MERGE BikeSpecs AS target
      USING (SELECT @bikeId AS BikeId) AS source
        ON target.BikeId = source.BikeId
      WHEN MATCHED THEN
        UPDATE SET Engine = @engine, DisplacementCc = @displacementCc,
                   BoreStrokeMm = @boreStrokeMm, Compression = @compression,
                   PowerHp = @powerHp, PowerKw = @powerKw, PowerRpm = @powerRpm,
                   TorqueNm = @torqueNm, TorqueRpm = @torqueRpm,
                   FuelSystem = @fuelSystem, Transmission = @transmission,
                   Clutch = @clutch, FinalDrive = @finalDrive, Frame = @frame,
                   FrontSuspension = @frontSuspension, RearSuspension = @rearSuspension,
                   BrakeFront = @brakeFront, BrakeRear = @brakeRear,
                   TyreFront = @tyreFront, TyreRear = @tyreRear,
                   WheelbaseMm = @wheelbaseMm, SeatHeightMm = @seatHeightMm,
                   GroundClearanceMm = @groundClearanceMm, KerbWeightKg = @kerbWeightKg,
                   FuelTankL = @fuelTankL, FuelEconomy = @fuelEconomy,
                   BatteryKwh = @batteryKwh, RangeKm = @rangeKm, Charging = @charging,
                   RiderAids = @riderAids, Display = @display
      WHEN NOT MATCHED THEN
        INSERT (BikeId, Engine, DisplacementCc, BoreStrokeMm, Compression, PowerHp,
                PowerKw, PowerRpm, TorqueNm, TorqueRpm, FuelSystem, Transmission,
                Clutch, FinalDrive, Frame, FrontSuspension, RearSuspension,
                BrakeFront, BrakeRear, TyreFront, TyreRear, WheelbaseMm,
                SeatHeightMm, GroundClearanceMm, KerbWeightKg, FuelTankL,
                FuelEconomy, BatteryKwh, RangeKm, Charging, RiderAids, Display)
        VALUES (@bikeId, @engine, @displacementCc, @boreStrokeMm, @compression, @powerHp,
                @powerKw, @powerRpm, @torqueNm, @torqueRpm, @fuelSystem, @transmission,
                @clutch, @finalDrive, @frame, @frontSuspension, @rearSuspension,
                @brakeFront, @brakeRear, @tyreFront, @tyreRear, @wheelbaseMm,
                @seatHeightMm, @groundClearanceMm, @kerbWeightKg, @fuelTankL,
                @fuelEconomy, @batteryKwh, @rangeKm, @charging, @riderAids, @display);
    `);
}

async function replaceMarkets(
  pool: sql.ConnectionPool,
  bikeId: number,
  markets: string[],
): Promise<void> {
  await pool
    .request()
    .input('bikeId', sql.Int, bikeId)
    .query('DELETE FROM BikeMarkets WHERE BikeId = @bikeId');

  for (const market of new Set(markets)) {
    await pool
      .request()
      .input('bikeId', sql.Int, bikeId)
      .input('marketCode', sql.NVarChar(8), market.toUpperCase())
      .query('INSERT INTO BikeMarkets (BikeId, MarketCode) VALUES (@bikeId, @marketCode)');
  }
}

async function replaceOtherPrices(
  pool: sql.ConnectionPool,
  bikeId: number,
  prices: Record<string, string> | null | undefined,
): Promise<void> {
  await pool
    .request()
    .input('bikeId', sql.Int, bikeId)
    .query('DELETE FROM BikePrices WHERE BikeId = @bikeId');

  if (!prices) return;

  for (const [market, raw] of Object.entries(prices)) {
    const parsed = parsePriceText(raw);
    if (!parsed) continue;

    await pool
      .request()
      .input('bikeId', sql.Int, bikeId)
      .input('marketCode', sql.NVarChar(8), market.toUpperCase())
      .input('currency', sql.Char(3), parsed.currency)
      .input('amount', sql.Decimal(12, 2), parsed.amount)
      .input('rawText', sql.NVarChar(200), parsed.text)
      .query(`
        INSERT INTO BikePrices (BikeId, MarketCode, Currency, Amount, RawText)
        VALUES (@bikeId, @marketCode, @currency, @amount, @rawText)
      `);
  }
}

async function run(): Promise<void> {
  const fresh = process.argv.includes('--fresh');
  const pool = await getPool();

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
      const bikeId = await upsertBike(pool, model, catalogue.brand, brandId, classId);
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
