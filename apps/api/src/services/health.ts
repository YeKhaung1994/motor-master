import { getPool } from '../db/pool.js';
import { logger } from '../logger.js';

export async function checkDatabase(): Promise<'up' | 'down'> {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1 AS ok');
    return 'up';
  } catch (error) {
    logger.warn({ error }, 'database health check failed');
    return 'down';
  }
}
