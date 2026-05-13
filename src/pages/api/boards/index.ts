import type { APIRoute } from 'astro';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.host) return new Response('Unauthorized', { status: 401 });
  const rows = await db.select({ id: schema.boards.id, title: schema.boards.title, createdAt: schema.boards.createdAt, updatedAt: schema.boards.updatedAt })
    .from(schema.boards)
    .where(eq(schema.boards.hostId, locals.host.hostId))
    .orderBy(desc(schema.boards.updatedAt));
  return new Response(JSON.stringify(rows), { status: 200 });
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.host) return new Response('Unauthorized', { status: 401 });
  const body = await request.json();
  const title = String(body.title || 'New Board').trim();

  const [{ id: boardId }] = await db.insert(schema.boards)
    .values({ hostId: locals.host.hostId, title })
    .$returningId();

  // Create default "Round 1" with 6 categories × 5 questions
  const [{ id: roundId }] = await db.insert(schema.rounds)
    .values({ boardId, title: 'Round 1', position: 0 })
    .$returningId();

  for (let ci = 0; ci < 6; ci++) {
    const [{ id: categoryId }] = await db.insert(schema.categories)
      .values({ roundId, title: `Category ${ci + 1}`, position: ci })
      .$returningId();
    for (let qi = 0; qi < 5; qi++) {
      await db.insert(schema.questions).values({
        categoryId,
        value: (qi + 1) * 200,
        question: 'Question text',
        answer: 'Answer text',
        isDailyDouble: false,
        position: qi,
      });
    }
  }

  return new Response(JSON.stringify({ id: boardId }), { status: 201 });
};
