import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    {
      name: 'jeoparty-ws',
      hooks: {
        'astro:server:setup': async ({ server }) => {
          const httpServer = server.httpServer;
          if (httpServer) {
            const { initWebSockets } = await import('./src/lib/ws');
            initWebSockets(httpServer as any);
          }
        }
      }
    }
  ]
});
