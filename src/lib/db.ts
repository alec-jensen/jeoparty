import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2';
import * as mysqlSchema from './schema';

export * as schema from './schema';
export type Schema = typeof mysqlSchema;

// Live-binding singleton — reassigned by initDb(), visible to all importers via ES module live bindings
export let db = null as unknown as MySql2Database<typeof mysqlSchema>;

export async function initDb() {
  if (db) return db;
  const url = process.env.DATABASE_URL ?? '';
  if (!url) throw new Error('DATABASE_URL is required');

  if (url.startsWith('file:') || url === ':memory:') {
    const { default: Database } = await import('better-sqlite3');
    const { drizzle: sqliteDrizzle } = await import('drizzle-orm/better-sqlite3');
    const sqliteSchema = await import('./schema.sqlite');
    const path = url === ':memory:' ? ':memory:' : url.replace(/^file:\/\//, '').replace(/^file:/, '');
    const sqlite = new Database(path);
    // Cast to MySQL type for uniform TS interface; query API is identical at runtime
    db = sqliteDrizzle(sqlite, { schema: sqliteSchema }) as unknown as MySql2Database<typeof mysqlSchema>;
  } else {
    const { createPool } = await import('mysql2/promise');
    db = drizzle(createPool(url), { schema: mysqlSchema, mode: 'default' });
  }

  // Auto-sync schema on startup
  try {
    const { execSync } = await import('node:child_process');
    process.stdout.write('Syncing database schema... ');
    execSync('npx drizzle-kit push', { stdio: 'ignore' });
    process.stdout.write('✓\n');
  } catch {
    // Schema push may fail on some deployments; not critical
  }

  return db;
}

export function isSqlite() {
  const url = process.env.DATABASE_URL ?? '';
  return url.startsWith('file:') || url === ':memory:';
}
