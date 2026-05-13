import { randomUUID } from 'node:crypto';
import type { APIRoute } from 'astro';
import { query } from '@/lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.host) return new Response('Unauthorized', { status: 401 });
  const { boardId } = await request.json();
  const boardRows = await query<any[]>('SELECT id FROM boards WHERE id = ? AND host_id = ?', [Number(boardId), locals.host.hostId]);
  if (!boardRows.length) return new Response('Board not found', { status: 404 });

  const gameId = randomUUID();
  await query('INSERT INTO games (id, board_id, host_id, status) VALUES (?, ?, ?, ?)', [gameId, Number(boardId), locals.host.hostId, 'lobby']);
  return new Response(JSON.stringify({ id: gameId }), { status: 201 });
};
