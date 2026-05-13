import { randomUUID } from 'node:crypto';
import type { APIRoute } from 'astro';
import { issuePlayerToken, PLAYER_COOKIE } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, params, cookies }) => {
  const gameId = String(params.id).toUpperCase();
  const { displayName } = await request.json();
  const name = String(displayName || '').trim();
  if (!name || name.length > 64) return new Response(JSON.stringify({ error: 'Display name is required (max 64 chars).' }), { status: 400 });

  const gameRows = await db.select({ id: schema.games.id, status: schema.games.status })
    .from(schema.games).where(eq(schema.games.id, gameId));
  if (!gameRows.length) return new Response(JSON.stringify({ error: 'Game not found.' }), { status: 404 });
  if (gameRows[0].status === 'finished') return new Response(JSON.stringify({ error: 'This game has already ended.' }), { status: 410 });

  const playerId = randomUUID();
  await db.insert(schema.players).values({ id: playerId, gameId, displayName: name });

  // Update in-memory state if the game is active
  const { addPlayerToGame } = await import('@/lib/gameState');
  console.log(`[API/Join] Updating in-memory state for game ${gameId}, player ${name}`);
  await addPlayerToGame(gameId, { id: playerId, displayName: name });

  const token = issuePlayerToken(playerId, gameId);
  cookies.set(PLAYER_COOKIE, token, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 });
  return new Response(JSON.stringify({ playerId, token }), { status: 201 });
};
