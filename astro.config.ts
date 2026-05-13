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
            const mod = await server.ssrLoadModule('./src/lib/ws');
            mod.initWebSockets(httpServer as any);
            console.log('🚀 WebSocket server integrated with Astro dev server');
          }
        }
      }
    }
  ]
});
