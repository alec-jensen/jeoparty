import { randomUUID } from 'node:crypto';
import type { APIRoute } from 'astro';
import { issuePlayerToken, PLAYER_COOKIE } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ params }) => {
  const gameId = String(params.id).toUpperCase();
  const rows = await db.select({ avatarColor: schema.players.avatarColor, avatarShape: schema.players.avatarShape })
    .from(schema.players).where(eq(schema.players.gameId, gameId));
  const taken = rows.map(r => ({ avatarColor: r.avatarColor ?? 0, avatarShape: r.avatarShape ?? 0 }));
  return new Response(JSON.stringify({ taken }), { status: 200, headers: { 'content-type': 'application/json' } });
};

export const POST: APIRoute = async ({ request, params, cookies }) => {
  const gameId = String(params.id).toUpperCase();
  const body = await request.json();
  const { displayName, avatarColor: rawColor, avatarShape: rawShape } = body;
  const name = String(displayName || '').trim();
  if (!name || name.length > 64) return new Response(JSON.stringify({ error: 'Display name is required (max 64 chars).' }), { status: 400 });

  const avatarColor = Math.max(0, Math.min(5,  Number.isFinite(Number(rawColor)) ? Math.floor(Number(rawColor)) : 0));
  const avatarShape = Math.max(0, Math.min(17, Number.isFinite(Number(rawShape)) ? Math.floor(Number(rawShape)) : 0));

  const gameRows = await db.select({ id: schema.games.id, status: schema.games.status })
    .from(schema.games).where(eq(schema.games.id, gameId));
  if (!gameRows.length) return new Response(JSON.stringify({ error: 'Game not found.' }), { status: 404 });
  if (gameRows[0].status === 'finished') return new Response(JSON.stringify({ error: 'This game has already ended.' }), { status: 410 });

  // Require unique display names within a game
  const existingPlayers = await db.select({ displayName: schema.players.displayName, avatarColor: schema.players.avatarColor, avatarShape: schema.players.avatarShape })
    .from(schema.players).where(eq(schema.players.gameId, gameId));
  const nameTaken = existingPlayers.some(p => p.displayName.toLowerCase() === name.toLowerCase());
  if (nameTaken) return new Response(JSON.stringify({ error: 'This name is already taken. Choose a different name.' }), { status: 409 });

  // Ensure avatar combination is unique in this game
  let finalColor = avatarColor;
  let finalShape = avatarShape;
  const takenCombos = new Set(existingPlayers.map(p => `${p.avatarColor ?? 0}:${p.avatarShape ?? 0}`));
  if (takenCombos.has(`${finalColor}:${finalShape}`)) {
    // Find the next available combination (6 colors × 24 shapes = 144 combos)
    outer: for (let c = 0; c < 6; c++) {
      for (let s = 0; s < 18; s++) {
        if (!takenCombos.has(`${c}:${s}`)) { finalColor = c; finalShape = s; break outer; }
      }
    }
  }

  const playerId = randomUUID();
  await db.insert(schema.players).values({ id: playerId, gameId, displayName: name, avatarColor: finalColor, avatarShape: finalShape } as any);

  // First player to join picks the first clue. Persist this to the DB so it
  // survives even if no host/presenter has connected (and the in-memory game
  // therefore doesn't exist yet).
  const fresh = await db.select({ currentPickerId: schema.games.currentPickerId })
    .from(schema.games).where(eq(schema.games.id, gameId));
  if (fresh.length && !fresh[0].currentPickerId) {
    await db.update(schema.games)
      .set({ currentPickerId: playerId })
      .where(eq(schema.games.id, gameId));
  }

  // Update in-memory state if the game is active
  const { addPlayerToGame } = await import('@/lib/gameState');
  console.log(`[API/Join] Updating in-memory state for game ${gameId}, player ${name}`);
  await addPlayerToGame(gameId, { id: playerId, displayName: name, avatarColor: finalColor, avatarShape: finalShape });

  const token = issuePlayerToken(playerId, gameId);
  cookies.set(PLAYER_COOKIE, token, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 });
  return new Response(JSON.stringify({ playerId, token, avatarColor: finalColor, avatarShape: finalShape }), { status: 201 });
};
