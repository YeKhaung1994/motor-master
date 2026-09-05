import { getPool } from '../db/pool.js';
import { logger } from '../logger.js';

export async function checkDatabase(): Promise<'up' | 'down'> {
  try {
    await getPool().query('SELECT 1');
    return 'up';
  } catch (error) {
    logger.warn({ error }, 'database health check failed');
    return 'down';
  }
}
