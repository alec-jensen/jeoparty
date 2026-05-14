import type { APIRoute } from 'astro';
import { db, schema, insertReturningId } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.host) return new Response('Unauthorized', { status: 401 });
  const rows = await db.select({
    id: schema.boards.id,
    title: schema.boards.title,
    finalCategory: schema.boards.finalCategory,
    finalQuestion: schema.boards.finalQuestion,
    finalAnswer: schema.boards.finalAnswer,
    createdAt: schema.boards.createdAt,
    updatedAt: schema.boards.updatedAt,
  })
    .from(schema.boards)
    .where(eq(schema.boards.hostId, locals.host.hostId))
    .orderBy(desc(schema.boards.updatedAt));
  return new Response(JSON.stringify(rows), { status: 200 });
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.host) return new Response('Unauthorized', { status: 401 });
  const body = await request.json();
  const title = String(body.title || 'New Board').trim();

  const boardId = await insertReturningId(schema.boards, { hostId: locals.host.hostId, title });
  
  // Create default "Round 1" with 6 categories × 5 questions
  const roundId = await insertReturningId(schema.rounds, { boardId, title: 'Round 1', position: 0 });

  for (let ci = 0; ci < 6; ci++) {
    const categoryId = await insertReturningId(schema.categories, { roundId, title: `Category ${ci + 1}`, position: ci });
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
