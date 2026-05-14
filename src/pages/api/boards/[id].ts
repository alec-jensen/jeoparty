import type { APIRoute } from 'astro';
import { db, schema, insertReturningId } from '@/lib/db';
import { eq, inArray, and } from 'drizzle-orm';

async function loadFullBoard(boardId: number) {
  const boardRows = await db.select({
    id: schema.boards.id,
    hostId: schema.boards.hostId,
    title: schema.boards.title,
    finalCategory: schema.boards.finalCategory,
    finalQuestion: schema.boards.finalQuestion,
    finalAnswer: schema.boards.finalAnswer,
  }).from(schema.boards).where(eq(schema.boards.id, boardId));
  if (!boardRows.length) return null;

  const roundRows = await db.select().from(schema.rounds).where(eq(schema.rounds.boardId, boardId)).orderBy(schema.rounds.position);
  const roundIds = roundRows.map(r => r.id);

  const categoryRows = roundIds.length
    ? await db.select().from(schema.categories).where(inArray(schema.categories.roundId, roundIds)).orderBy(schema.categories.position)
    : [];
  const categoryIds = categoryRows.map(c => c.id);

  const questionRows = categoryIds.length
    ? await db.select().from(schema.questions).where(inArray(schema.questions.categoryId, categoryIds)).orderBy(schema.questions.position)
    : [];

  const qByCategory = new Map<number, any[]>();
  for (const q of questionRows) {
    const list = qByCategory.get(q.categoryId) ?? [];
    list.push({ id: q.id, value: q.value, question: q.question, answer: q.answer, isDailyDouble: !!q.isDailyDouble, position: q.position });
    qByCategory.set(q.categoryId, list);
  }
  const cByRound = new Map<number, any[]>();
  for (const c of categoryRows) {
    const list = cByRound.get(c.roundId) ?? [];
    list.push({ id: c.id, title: c.title, position: c.position, questions: qByCategory.get(c.id) ?? [] });
    cByRound.set(c.roundId, list);
  }

  return {
    id: boardRows[0].id,
    hostId: boardRows[0].hostId,
    title: boardRows[0].title,
    finalCategory: boardRows[0].finalCategory ?? '',
    finalQuestion: boardRows[0].finalQuestion ?? '',
    finalAnswer: boardRows[0].finalAnswer ?? '',
    rounds: roundRows.map(r => ({ id: r.id, title: r.title, position: r.position, categories: cByRound.get(r.id) ?? [] })),
  };
}

export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.host) return new Response('Unauthorized', { status: 401 });
  const board = await loadFullBoard(Number(params.id));
  if (!board || board.hostId !== locals.host.hostId) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(board), { status: 200 });
};

export const PUT: APIRoute = async ({ params, locals, request }) => {
  if (!locals.host) return new Response('Unauthorized', { status: 401 });
  const boardId = Number(params.id);
  const payload = await request.json();

  const boardCheck = await db.select({ hostId: schema.boards.hostId })
    .from(schema.boards).where(eq(schema.boards.id, boardId));
  if (!boardCheck.length || boardCheck[0].hostId !== locals.host.hostId) return new Response('Not found', { status: 404 });

  await db.update(schema.boards).set({
    title: String(payload.title || 'Untitled Board'),
    finalCategory: payload.finalCategory ? String(payload.finalCategory) : null,
    finalQuestion: payload.finalQuestion ? String(payload.finalQuestion) : null,
    finalAnswer: payload.finalAnswer ? String(payload.finalAnswer) : null,
  }).where(eq(schema.boards.id, boardId));

  const incomingRounds: any[] = Array.isArray(payload.rounds) ? payload.rounds : [];
  const keepRoundIds = incomingRounds.filter(r => r.id).map(r => Number(r.id));
  // Delete removed rounds (cascade deletes categories + questions)
  const existingRounds = await db.select({ id: schema.rounds.id }).from(schema.rounds).where(eq(schema.rounds.boardId, boardId));
  const toDeleteRoundIds = existingRounds.map(r => r.id).filter(id => !keepRoundIds.includes(id));
  if (toDeleteRoundIds.length) await db.delete(schema.rounds).where(inArray(schema.rounds.id, toDeleteRoundIds));

  for (let ri = 0; ri < incomingRounds.length; ri++) {
    const round = incomingRounds[ri];
    let roundId = round.id ? Number(round.id) : 0;

    if (roundId) {
      await db.update(schema.rounds).set({ title: String(round.title || 'Round'), position: ri }).where(and(eq(schema.rounds.id, roundId), eq(schema.rounds.boardId, boardId)));
    } else {
      roundId = await insertReturningId(schema.rounds, { boardId, title: String(round.title || 'Round'), position: ri });
    }

    const incomingCats: any[] = Array.isArray(round.categories) ? round.categories : [];
    const keepCatIds = incomingCats.filter(c => c.id).map(c => Number(c.id));
    const existingCats = await db.select({ id: schema.categories.id }).from(schema.categories).where(eq(schema.categories.roundId, roundId));
    const toDeleteCatIds = existingCats.map(c => c.id).filter(id => !keepCatIds.includes(id));
    if (toDeleteCatIds.length) await db.delete(schema.categories).where(inArray(schema.categories.id, toDeleteCatIds));

    for (let ci = 0; ci < incomingCats.length; ci++) {
      const cat = incomingCats[ci];
      let catId = cat.id ? Number(cat.id) : 0;

      if (catId) {
        await db.update(schema.categories).set({ title: String(cat.title || 'Category'), position: ci }).where(eq(schema.categories.id, catId));
      } else {
        catId = await insertReturningId(schema.categories, { roundId, title: String(cat.title || 'Category'), position: ci });
      }

      const incomingQs: any[] = Array.isArray(cat.questions) ? cat.questions : [];
      const keepQIds = incomingQs.filter(q => q.id).map(q => Number(q.id));
      const existingQs = await db.select({ id: schema.questions.id }).from(schema.questions).where(eq(schema.questions.categoryId, catId));
      const toDeleteQIds = existingQs.map(q => q.id).filter(id => !keepQIds.includes(id));
      if (toDeleteQIds.length) await db.delete(schema.questions).where(inArray(schema.questions.id, toDeleteQIds));

      for (let qi = 0; qi < incomingQs.length; qi++) {
        const q = incomingQs[qi];
        const vals = {
          value: Number(q.value || 0),
          question: String(q.question || ''),
          answer: String(q.answer || ''),
          isDailyDouble: !!q.isDailyDouble,
          position: qi,
        };
        if (q.id) {
          await db.update(schema.questions).set(vals).where(eq(schema.questions.id, Number(q.id)));
        } else {
          await db.insert(schema.questions).values({ categoryId: catId, ...vals });
        }
      }
    }
  }

  const updated = await loadFullBoard(boardId);
  return new Response(JSON.stringify(updated), { status: 200 });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.host) return new Response('Unauthorized', { status: 401 });
  await db.delete(schema.boards).where(and(eq(schema.boards.id, Number(params.id)), eq(schema.boards.hostId, locals.host.hostId)));
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
