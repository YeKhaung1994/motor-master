import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { getPool, sql, closePool } from '../db/pool.js';
import { logger } from '../logger.js';

const dbDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'db');
const seedDir = join(dbDir, 'seed');

/**
 * The shape a brand catalogue file must have. Every spec field is optional, so a
 * file can carry only the headline figures now and be re-imported with the full
 * manufacturer sheet later.
 */
const specsSchema = z
  .object({
    engine: z.string().nullish(),
    displacementCc: z.number().int().nullish(),
    powerHp: z.number().nullish(),
    torqueNm: z.number().nullish(),
    transmission: z.string().nullish(),
    frontSuspension: z.string().nullish(),
    rearSuspension: z.string().nullish(),
    brakes: z.string().nullish(),
    tyres: z.string().nullish(),
    wheelbaseMm: z.number().int().nullish(),
    kerbWeightKg: z.number().nullish(),
    seatHeightMm: z.number().int().nullish(),
    fuelTankL: z.number().nullish(),
    riderAids: z.string().nullish(),
    display: z.string().nullish(),
  })
  .default({});

const brandFileSchema = z.object({
  brand: z.object({
    name: z.string().min(1).max(80),
    countryCode: z.string().length(2),
    slug: z.string().min(1).max(80),
  }),
  bikes: z.array(
    z.object({
      name: z.string().min(1).max(120),
      slug: z.string().min(1).max(140),
      class: z.string().min(1).max(40),
      modelYear: z.number().int().min(1900).max(2100),
      priceUsd: z.number().nonnegative(),
      imageUrl: z.string().nullish(),
      specs: specsSchema,
    }),
  ),
});

type BrandFile = z.infer<typeof brandFileSchema>;
type SpecValues = z.infer<typeof specsSchema>;

async function seedClasses(pool: sql.ConnectionPool): Promise<void> {
  const script = await readFile(join(dbDir, 'seed.sql'), 'utf8');
  await pool.request().batch(script);
}

async function upsertBrand(pool: sql.ConnectionPool, brand: BrandFile['brand']): Promise<number> {
  const result = await pool
    .request()
    .input('name', sql.NVarChar(80), brand.name)
    .input('countryCode', sql.Char(2), brand.countryCode)
    .input('slug', sql.NVarChar(80), brand.slug)
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
  if (!row) throw new Error(`Could not resolve BrandId for ${brand.slug}`);
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
  bike: BrandFile['bikes'][number],
  brandId: number,
  classId: number,
): Promise<number> {
  const result = await pool
    .request()
    .input('brandId', sql.Int, brandId)
    .input('classId', sql.Int, classId)
    .input('name', sql.NVarChar(120), bike.name)
    .input('slug', sql.NVarChar(140), bike.slug)
    .input('modelYear', sql.SmallInt, bike.modelYear)
    .input('priceUsd', sql.Decimal(10, 2), bike.priceUsd)
    .input('imageUrl', sql.NVarChar(400), bike.imageUrl ?? null)
    .query<{ BikeId: number }>(`
      MERGE Bikes AS target
      USING (SELECT @slug AS Slug) AS source
        ON target.Slug = source.Slug
      WHEN MATCHED THEN
        UPDATE SET BrandId = @brandId, ClassId = @classId, Name = @name,
                   ModelYear = @modelYear, PriceUsd = @priceUsd, ImageUrl = @imageUrl
      WHEN NOT MATCHED THEN
        INSERT (BrandId, ClassId, Name, Slug, ModelYear, PriceUsd, ImageUrl)
        VALUES (@brandId, @classId, @name, @slug, @modelYear, @priceUsd, @imageUrl);

      SELECT BikeId FROM Bikes WHERE Slug = @slug;
    `);

  const row = result.recordset[0];
  if (!row) throw new Error(`Could not resolve BikeId for ${bike.slug}`);
  return row.BikeId;
}

async function upsertSpecs(
  pool: sql.ConnectionPool,
  bikeId: number,
  specs: SpecValues,
): Promise<void> {
  await pool
    .request()
    .input('bikeId', sql.Int, bikeId)
    .input('engine', sql.NVarChar(200), specs.engine ?? null)
    .input('displacementCc', sql.Int, specs.displacementCc ?? null)
    .input('powerHp', sql.Decimal(6, 1), specs.powerHp ?? null)
    .input('torqueNm', sql.Decimal(6, 1), specs.torqueNm ?? null)
    .input('transmission', sql.NVarChar(120), specs.transmission ?? null)
    .input('frontSuspension', sql.NVarChar(200), specs.frontSuspension ?? null)
    .input('rearSuspension', sql.NVarChar(200), specs.rearSuspension ?? null)
    .input('brakes', sql.NVarChar(200), specs.brakes ?? null)
    .input('tyres', sql.NVarChar(80), specs.tyres ?? null)
    .input('wheelbaseMm', sql.Int, specs.wheelbaseMm ?? null)
    .input('kerbWeightKg', sql.Decimal(6, 1), specs.kerbWeightKg ?? null)
    .input('seatHeightMm', sql.Int, specs.seatHeightMm ?? null)
    .input('fuelTankL', sql.Decimal(5, 1), specs.fuelTankL ?? null)
    .input('riderAids', sql.NVarChar(200), specs.riderAids ?? null)
    .input('display', sql.NVarChar(80), specs.display ?? null)
    .query(`
      MERGE BikeSpecs AS target
      USING (SELECT @bikeId AS BikeId) AS source
        ON target.BikeId = source.BikeId
      WHEN MATCHED THEN
        UPDATE SET Engine = @engine, DisplacementCc = @displacementCc, PowerHp = @powerHp,
                   TorqueNm = @torqueNm, Transmission = @transmission,
                   FrontSuspension = @frontSuspension, RearSuspension = @rearSuspension,
                   Brakes = @brakes, Tyres = @tyres, WheelbaseMm = @wheelbaseMm,
                   KerbWeightKg = @kerbWeightKg, SeatHeightMm = @seatHeightMm,
                   FuelTankL = @fuelTankL, RiderAids = @riderAids, Display = @display
      WHEN NOT MATCHED THEN
        INSERT (BikeId, Engine, DisplacementCc, PowerHp, TorqueNm, Transmission,
                FrontSuspension, RearSuspension, Brakes, Tyres, WheelbaseMm,
                KerbWeightKg, SeatHeightMm, FuelTankL, RiderAids, Display)
        VALUES (@bikeId, @engine, @displacementCc, @powerHp, @torqueNm, @transmission,
                @frontSuspension, @rearSuspension, @brakes, @tyres, @wheelbaseMm,
                @kerbWeightKg, @seatHeightMm, @fuelTankL, @riderAids, @display);
    `);
}

async function run(): Promise<void> {
  const pool = await getPool();
  await seedClasses(pool);

  const files = (await readdir(seedDir)).filter((file) => file.endsWith('.json')).sort();
  if (files.length === 0) {
    logger.warn({ seedDir }, 'no brand files found — nothing to seed');
    return;
  }

  let bikeCount = 0;

  for (const file of files) {
    const raw = JSON.parse(await readFile(join(seedDir, file), 'utf8')) as unknown;
    const parsed = brandFileSchema.safeParse(raw);

    if (!parsed.success) {
      logger.error({ file, issues: parsed.error.issues }, 'skipping malformed brand file');
      throw new Error(`${file} does not match the brand catalogue schema`);
    }

    const { brand, bikes } = parsed.data;
    const brandId = await upsertBrand(pool, brand);

    for (const bike of bikes) {
      const classId = await resolveClassId(pool, bike.class);
      const bikeId = await upsertBike(pool, bike, brandId, classId);
      await upsertSpecs(pool, bikeId, bike.specs);
      bikeCount += 1;
    }

    logger.info({ file, brand: brand.name, bikes: bikes.length }, 'imported brand catalogue');
  }

  logger.info({ brands: files.length, bikes: bikeCount }, 'seed complete');
}

run()
  .then(() => closePool())
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error({ error }, 'seed failed');
    process.exit(1);
  });
