import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2';
import * as mysqlSchema from './schema';
import * as sqliteSchema from './schema.sqlite';

export * as mysqlSchema from './schema';
export * as sqliteSchema from './schema.sqlite';

export const schema = (process.env.DATABASE_URL || (import.meta as any).env?.DATABASE_URL || '').startsWith('file:') || (process.env.DATABASE_URL || (import.meta as any).env?.DATABASE_URL || '') === ':memory:' 
  ? sqliteSchema as unknown as typeof mysqlSchema 
  : mysqlSchema;

export type Schema = typeof mysqlSchema;

async function createDbInstance() {
  const url = process.env.DATABASE_URL || (import.meta as any).env?.DATABASE_URL || '';
  if (!url) throw new Error('DATABASE_URL is required');

  let instance: MySql2Database<typeof mysqlSchema>;

  if (url.startsWith('file:') || url === ':memory:') {
    const { default: Database } = await import('better-sqlite3');
    const { drizzle: sqliteDrizzle } = await import('drizzle-orm/better-sqlite3');
    const sqliteSchema = await import('./schema.sqlite');
    const path = url === ':memory:' ? ':memory:' : url.replace(/^file:\/\//, '').replace(/^file:/, '');
    const sqlite = new Database(path);
    // Cast to MySQL type for uniform TS interface; query API is identical at runtime
    instance = sqliteDrizzle(sqlite, { schema: sqliteSchema }) as unknown as MySql2Database<typeof mysqlSchema>;
  } else {
    const { createPool } = await import('mysql2/promise');
    instance = drizzle(createPool(url), { schema: mysqlSchema, mode: 'default' });
  }

  // Auto-sync schema on startup — guard with process.env so it only runs once
  // even if this module is evaluated multiple times in the same process (Vite SSR quirk)
  if (!process.env.__JEOPARTY_DB_SYNCED) {
    process.env.__JEOPARTY_DB_SYNCED = '1';
    try {
      const { execSync } = await import('node:child_process');
      process.stdout.write('Syncing database schema... ');
      execSync('npx drizzle-kit push', {
        stdio: 'ignore',
        env: { ...process.env, DATABASE_URL: url }
      });
      process.stdout.write('✓\n');
    } catch {
      // Schema push may fail on some deployments; not critical
    }
  }

  return instance;
}

export const db = await createDbInstance();

export async function initDb() {
  return db;
}

export function isSqlite() {
  const url = process.env.DATABASE_URL || (import.meta as any).env?.DATABASE_URL || '';
  return url.startsWith('file:') || url === ':memory:';
}

/**
 * Dialect-agnostic helper to insert a row and return its ID.
 * Uses .returning() for SQLite and .$returningId() for MySQL.
 */
export async function insertReturningId(table: any, values: any): Promise<any> {
  if (isSqlite()) {
    const res = await (db as any).insert(table).values(values).returning({ id: table.id });
    return res[0].id;
  } else {
    const res = await (db.insert(table).values(values) as any).$returningId();
    return res[0].id;
  }
}
