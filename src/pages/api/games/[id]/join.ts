import { randomUUID } from 'node:crypto';
import type { APIRoute } from 'astro';
import { issuePlayerToken, PLAYER_COOKIE } from '@/lib/auth';
import { query } from '@/lib/db';

export const POST: APIRoute = async ({ request, params, cookies }) => {
  const gameId = String(params.id);
  const { displayName } = await request.json();
  const name = String(displayName || '').trim();
  if (!name || name.length > 64) return new Response(JSON.stringify({ error: 'Display name is required.' }), { status: 400 });

  const gameRows = await query<any[]>('SELECT id FROM games WHERE id = ?', [gameId]);
  if (!gameRows.length) return new Response('Game not found', { status: 404 });

  const playerId = randomUUID();
  await query('INSERT INTO players (id, game_id, display_name) VALUES (?, ?, ?)', [playerId, gameId, name]);

  const token = issuePlayerToken(playerId, gameId);
  cookies.set(PLAYER_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60
  });

  return new Response(JSON.stringify({ playerId, token }), { status: 201 });
};
