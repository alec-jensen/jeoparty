import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL ?? '';
const isSqlite = url.startsWith('file:') || url === ':memory:';

export default defineConfig({
  schema: isSqlite ? './src/lib/schema.sqlite.ts' : './src/lib/schema.ts',
  dialect: isSqlite ? 'sqlite' : 'mysql',
  dbCredentials: { url },
  out: './drizzle',
});
