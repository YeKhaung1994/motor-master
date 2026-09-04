import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { getMasterPool, getPool, sql, closePool } from '../db/pool.js';
import { logger } from '../logger.js';

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations');

/** Database and table names come from disk, never from a request. */
async function ensureDatabase(): Promise<void> {
  const master = await getMasterPool();
  try {
    const existing = await master
      .request()
      .input('name', sql.NVarChar(128), config.db.database)
      .query('SELECT 1 FROM sys.databases WHERE name = @name');

    if (existing.recordset.length === 0) {
      // CREATE DATABASE cannot be parameterised; the name is validated first.
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(config.db.database)) {
        throw new Error(`Unsafe database name: ${config.db.database}`);
      }
      await master.request().batch(`CREATE DATABASE [${config.db.database}]`);
      logger.info({ database: config.db.database }, 'created database');
    }
  } finally {
    await master.close();
  }
}

async function ensureMigrationsTable(pool: sql.ConnectionPool): Promise<void> {
  await pool.request().batch(`
    IF OBJECT_ID('dbo.SchemaMigrations', 'U') IS NULL
      CREATE TABLE SchemaMigrations (
        Name      NVARCHAR(200) PRIMARY KEY,
        AppliedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      );
  `);
}

async function run(): Promise<void> {
  await ensureDatabase();
  const pool = await getPool();
  await ensureMigrationsTable(pool);

  const applied = await pool.request().query<{ Name: string }>('SELECT Name FROM SchemaMigrations');
  const done = new Set(applied.recordset.map((row) => row.Name));

  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();

  for (const file of files) {
    if (done.has(file)) {
      logger.info({ migration: file }, 'already applied, skipping');
      continue;
    }

    const script = await readFile(join(migrationsDir, file), 'utf8');
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      // GO is a client batch separator, not T-SQL — split on it ourselves.
      const batches = script
        .split(/^\s*GO\s*$/gim)
        .map((batch) => batch.trim())
        .filter(Boolean);

      for (const batch of batches) {
        await new sql.Request(transaction).batch(batch);
      }

      await new sql.Request(transaction)
        .input('name', sql.NVarChar(200), file)
        .query('INSERT INTO SchemaMigrations (Name) VALUES (@name)');

      await transaction.commit();
      logger.info({ migration: file }, 'applied');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  logger.info('migrations up to date');
}

run()
  .then(() => closePool())
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error({ error }, 'migration failed');
    process.exit(1);
  });
