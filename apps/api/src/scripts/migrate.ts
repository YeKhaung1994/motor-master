import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { closePool, getMaintenancePool, getPool } from '../db/pool.js';
import { logger } from '../logger.js';

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations');

/** Database names come from configuration, never from a request. */
async function ensureDatabase(): Promise<void> {
  const maintenance = getMaintenancePool();
  try {
    const existing = await maintenance.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      config.db.database,
    ]);
    if (existing.rowCount === 0) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(config.db.database)) {
        throw new Error(`Unsafe database name: ${config.db.database}`);
      }
      // CREATE DATABASE cannot be parameterised; the name is validated first.
      await maintenance.query(`CREATE DATABASE "${config.db.database}"`);
      logger.info({ database: config.db.database }, 'created database');
    }
  } catch (error) {
    // A managed provider hands you a database and forbids creating one. That is
    // fine — the migrations below will tell us soon enough if it is missing.
    logger.warn({ error }, 'could not verify the database exists; continuing');
  } finally {
    await maintenance.end();
  }
}

async function run(): Promise<void> {
  await ensureDatabase();
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       varchar(200) PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const applied = await pool.query<{ name: string }>('SELECT name FROM schema_migrations');
  const done = new Set(applied.rows.map((row) => row.name));

  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    if (done.has(file)) {
      logger.info({ migration: file }, 'already applied, skipping');
      continue;
    }

    const script = await readFile(join(migrationsDir, file), 'utf8');
    const client = await pool.connect();
    try {
      // Postgres runs DDL transactionally, so a failed migration leaves nothing
      // half-applied.
      await client.query('BEGIN');
      await client.query(script);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      logger.info({ migration: file }, 'applied');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
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
