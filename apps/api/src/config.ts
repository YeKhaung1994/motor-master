import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

// The repo-root .env is the single place to configure a local checkout; an
// apps/api/.env overrides it when one exists.
loadEnv({ path: resolve(process.cwd(), '../../.env') });
loadEnv();

function bool(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

/**
 * Managed Postgres is handed out as a single connection string — Supabase, Neon,
 * Render and Fly all do this — while a local container is easier to describe as
 * discrete fields. Both are supported, and a connection string wins when set.
 */
const connectionString = process.env.DATABASE_URL?.trim() || undefined;

function requiredWithoutUrl(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Set DATABASE_URL, or copy .env.example to .env for a local database.`,
    );
  }
  return value;
}

/** A managed provider always needs TLS; a local container does not offer it. */
function sslDefault(): boolean {
  if (process.env.DB_SSL !== undefined) return bool('DB_SSL', false);
  if (!connectionString) return false;
  return !/localhost|127\.0\.0\.1/.test(connectionString);
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  db: {
    connectionString,
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? 'motor_master',
    user: connectionString ? (process.env.DB_USER ?? '') : requiredWithoutUrl('DB_USER'),
    password: connectionString ? (process.env.DB_PASSWORD ?? '') : requiredWithoutUrl('DB_PASSWORD'),
    ssl: sslDefault() ? { rejectUnauthorized: false } : false,
  },
} as const;

/** What to show in a log line without leaking the password. */
export function describeDatabase(): string {
  if (config.db.connectionString) {
    try {
      const url = new URL(config.db.connectionString);
      return `${url.hostname}:${url.port || 5432}${url.pathname}`;
    } catch {
      return 'connection string';
    }
  }
  return `${config.db.host}:${config.db.port}/${config.db.database}`;
}
