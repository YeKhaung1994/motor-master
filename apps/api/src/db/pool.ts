import sql from 'mssql';
import { config } from '../config.js';
import { logger } from '../logger.js';

const poolConfig: sql.config = {
  server: config.db.server,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  options: {
    encrypt: config.db.encrypt,
    trustServerCertificate: config.db.trustServerCertificate,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30_000 },
  requestTimeout: 15_000,
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

/** One pool per process — mssql pools are safe to share and expensive to make. */
export function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(poolConfig)
      .connect()
      .then((pool) => {
        logger.info(
          { server: config.db.server, database: config.db.database },
          'connected to SQL Server',
        );
        pool.on('error', (error) => logger.error({ error }, 'connection pool error'));
        return pool;
      })
      .catch((error) => {
        // Let the next call retry rather than caching a rejected promise forever.
        poolPromise = null;
        throw error;
      });
  }
  return poolPromise;
}

export async function closePool(): Promise<void> {
  if (!poolPromise) return;
  const pool = await poolPromise;
  poolPromise = null;
  await pool.close();
}

/** Connects to `master` instead of the app database — used by the migrator. */
export async function getMasterPool(): Promise<sql.ConnectionPool> {
  return new sql.ConnectionPool({ ...poolConfig, database: 'master' }).connect();
}

export { sql };
