import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

// The repo-root .env is the single place to configure a local checkout; an
// apps/api/.env overrides it when one exists.
loadEnv({ path: resolve(process.cwd(), '../../.env') });
loadEnv();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. Copy .env.example to .env.`);
  }
  return value;
}

function bool(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  db: {
    server: process.env.DB_SERVER ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 1433),
    database: process.env.DB_NAME ?? 'motor_master',
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    encrypt: bool('DB_ENCRYPT', true),
    trustServerCertificate: bool('DB_TRUST_CERT', true),
  },
} as const;
