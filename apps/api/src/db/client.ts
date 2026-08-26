// Server-only Drizzle client. Imported from API route handlers (server
// code) — never from client components. SSL is auto-enabled when the
// DATABASE_URL signals it (managed Postgres providers typically pin
// `sslmode=require` or run on AWS RDS).

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../env.js';
import * as schema from './schema.js';

const url = env.DATABASE_URL;
const requiresSsl = url.includes('sslmode=require') || url.includes('rds.amazonaws');

const client = postgres(url, {
  max: 10,
  ssl: requiresSsl ? 'require' : false,
});

export const db = drizzle(client, { schema });
export { schema };
