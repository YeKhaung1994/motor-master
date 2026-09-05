import pg from 'pg';
import { config, describeDatabase } from '../config.js';
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

const shared = {
  ssl: config.db.ssl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
};

const poolConfig: pg.PoolConfig = config.db.connectionString
  ? { connectionString: config.db.connectionString, ...shared }
  : {
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
      user: config.db.user,
      password: config.db.password,
      ...shared,
    };

let pool: pg.Pool | null = null;

/** One pool per process — pools are safe to share and expensive to make. */
export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool(poolConfig);
    pool.on('error', (error) => logger.error({ error }, 'connection pool error'));
    logger.info({ database: describeDatabase() }, 'postgres pool ready');
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (!pool) return;
  const current = pool;
  pool = null;
  await current.end();
}

/**
 * Connects to the maintenance database — used by the migrator to create the
 * application database locally. A managed provider hands you a database and
 * forbids creating one, so there this is simply the same connection.
 */
export function getMaintenancePool(): pg.Pool {
  if (config.db.connectionString) return new Pool(poolConfig);
  return new Pool({ ...poolConfig, database: 'postgres' });
}

export type { Pool, QueryResult } from 'pg';
