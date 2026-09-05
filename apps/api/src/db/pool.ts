import pg from 'pg';
import { config } from '../config.js';
import { logger } from '../logger.js';

const { Pool } = pg;

/**
 * Postgres returns NUMERIC as a string to avoid silent precision loss. Every
 * numeric column here is a spec figure or a price that comfortably fits a
 * double, and the DTOs promise numbers, so parse them at the driver.
 */
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value) => Number(value));
// DATE should be a plain calendar day, not a timestamp in the server's zone.
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

const poolConfig: pg.PoolConfig = {
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  ssl: config.db.ssl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
};

let pool: pg.Pool | null = null;

/** One pool per process — pools are safe to share and expensive to make. */
export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool(poolConfig);
    pool.on('error', (error) => logger.error({ error }, 'connection pool error'));
    logger.info({ host: config.db.host, database: config.db.database }, 'postgres pool ready');
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (!pool) return;
  const current = pool;
  pool = null;
  await current.end();
}

/** Connects to the maintenance database instead — used by the migrator. */
export function getMaintenancePool(): pg.Pool {
  return new Pool({ ...poolConfig, database: 'postgres' });
}

export type { Pool, QueryResult } from 'pg';
