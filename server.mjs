import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';

function loadDotEnv(path = '.env') {
  if (!existsSync(path)) return;

  const env = readFileSync(path, 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^(?:export\s+)?([\w.-]+)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;

    const value = rawValue
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2');
    process.env[key] = value;
  }
}

loadDotEnv();

const [{ handler }, { initDb }, { initWebSockets }] = await Promise.all([
  import('./dist/server/entry.mjs'),
  import('./src/lib/db.ts'),
  import('./src/lib/ws.ts')
]);

const port = Number(process.env.PORT || 3000);

// Initialize database (creates connection pool / SQLite file)
await initDb();
console.log('Database initialized.');

const server = createServer((req, res) => {
  handler(req, res);
});

initWebSockets(server);

server.listen(port, () => {
  console.log(`Jeoparty listening on http://localhost:${port}`);
});
