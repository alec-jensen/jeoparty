import { createServer } from 'node:http';
import { handler } from './dist/server/entry.mjs';
import { ensureSchema } from './src/lib/db.ts';
import { initWebSockets } from './src/lib/ws.ts';

const port = Number(process.env.PORT || 3000);

await ensureSchema();

const server = createServer((req, res) => {
  handler(req, res);
});

initWebSockets(server);

server.listen(port, () => {
  console.log(`Jeoparty listening on http://localhost:${port}`);
});
