import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function generateCode(): string {
  return Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * 26)]).join('');
}

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = generateCode();
    const existing = await db.select({ id: schema.games.id }).from(schema.games).where(eq(schema.games.id, code));
    if (!existing.length) return code;
  }
  throw new Error('Could not generate a unique game code. Try again.');
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.host) return new Response('Unauthorized', { status: 401 });
  const { boardId, teamMode, numTeams, optDailyDoubles, optSoundEffects, optShuffle } = await request.json();

  const boardRows = await db.select({ id: schema.boards.id }).from(schema.boards)
    .where(eq(schema.boards.id, Number(boardId)));
  if (!boardRows.length) return new Response('Board not found', { status: 404 });

  // Verify host owns the board
  const owned = await db.select({ id: schema.boards.id }).from(schema.boards)
    .where(eq(schema.boards.hostId, locals.host.hostId));
  if (!owned.some(b => b.id === Number(boardId))) return new Response('Board not found', { status: 404 });

  const gameId = await uniqueCode();
  await db.insert(schema.games).values({
    id: gameId,
    boardId: Number(boardId),
    hostId: locals.host.hostId,
    teamMode: !!teamMode,
    numTeams: teamMode ? Math.max(2, Number(numTeams) || 2) : 0,
    status: 'lobby',
    currentRound: 0,
    optDailyDoubles: optDailyDoubles !== false,
    optSoundEffects: optSoundEffects !== false,
    optShuffle: !!optShuffle,
  } as any);

  // Create team rows if team mode is on
  if (teamMode && numTeams > 1) {
    const names = ['Team A', 'Team B', 'Team C', 'Team D', 'Team E', 'Team F'];
    for (let i = 0; i < Math.min(numTeams, 6); i++) {
      await db.insert(schema.teams).values({ gameId, name: names[i], position: i });
    }
  }

  return new Response(JSON.stringify({ id: gameId }), { status: 201 });
};
