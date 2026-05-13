import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { requireHost } from '@/middleware/auth';

export const GET: APIRoute = async (context) => {
  const gameId = String(context.params.id).toUpperCase();
  const gameRows = await db.select({ id: schema.games.id, hostId: schema.games.hostId })
    .from(schema.games).where(eq(schema.games.id, gameId));
  if (!gameRows.length) return new Response(JSON.stringify({ error: 'Game not found.' }), { status: 404 });

  const host = await requireHost(context);
  if (!host) return new Response(JSON.stringify({ error: 'Not authenticated.' }), { status: 401 });
  if (host.hostId !== gameRows[0].hostId) return new Response(JSON.stringify({ error: 'Forbidden.' }), { status: 403 });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
