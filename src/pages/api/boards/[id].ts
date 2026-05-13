import type { APIRoute } from 'astro';
import { pool, query } from '@/lib/db';

async function loadBoard(id: number) {
  const boardRows = await query<any[]>('SELECT id, host_id, title FROM boards WHERE id = ?', [id]);
  if (!boardRows.length) return null;
  const categoryRows = await query<any[]>('SELECT id, title, position FROM categories WHERE board_id = ? ORDER BY position', [id]);
  const questions = await query<any[]>(
    'SELECT id, category_id, value, question, answer, is_daily_double, position FROM questions WHERE category_id IN (?) ORDER BY position',
    [categoryRows.length ? categoryRows.map((c) => c.id) : [0]]
  );
  const questionMap = new Map<number, any[]>();
  for (const q of questions) {
    const list = questionMap.get(q.category_id) ?? [];
    list.push({
      id: q.id,
      value: q.value,
      question: q.question,
      answer: q.answer,
      isDailyDouble: !!q.is_daily_double,
      position: q.position
    });
    questionMap.set(q.category_id, list);
  }

  return {
    id: boardRows[0].id,
    hostId: boardRows[0].host_id,
    title: boardRows[0].title,
    categories: categoryRows.map((c) => ({ id: c.id, title: c.title, position: c.position, questions: questionMap.get(c.id) || [] }))
  };
}

export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.host) return new Response('Unauthorized', { status: 401 });
  const board = await loadBoard(Number(params.id));
  if (!board || board.hostId !== locals.host.hostId) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(board), { status: 200 });
};

export const PUT: APIRoute = async ({ params, locals, request }) => {
  if (!locals.host) return new Response('Unauthorized', { status: 401 });
  const boardId = Number(params.id);
  const payload = await request.json();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [boardRows] = await conn.query<any[]>('SELECT id, host_id FROM boards WHERE id = ? FOR UPDATE', [boardId]);
    if (!boardRows.length || boardRows[0].host_id !== locals.host.hostId) {
      await conn.rollback();
      return new Response('Not found', { status: 404 });
    }

    await conn.query('UPDATE boards SET title = ? WHERE id = ?', [String(payload.title || 'Untitled Board'), boardId]);

    const categories = Array.isArray(payload.categories) ? payload.categories : [];
    const keepCategoryIds = categories.filter((c: any) => c.id).map((c: any) => Number(c.id));
    if (keepCategoryIds.length) {
      await conn.query(`DELETE FROM categories WHERE board_id = ? AND id NOT IN (${keepCategoryIds.map(() => '?').join(',')})`, [
        boardId,
        ...keepCategoryIds
      ]);
    } else {
      await conn.query('DELETE FROM categories WHERE board_id = ?', [boardId]);
    }

    for (let ci = 0; ci < categories.length; ci++) {
      const cat = categories[ci];
      let categoryId = Number(cat.id || 0);
      if (categoryId) {
        await conn.query('UPDATE categories SET title = ?, position = ? WHERE id = ? AND board_id = ?', [
          String(cat.title || 'Category'),
          Number(cat.position ?? ci),
          categoryId,
          boardId
        ]);
      } else {
        const [res] = await conn.query<any>('INSERT INTO categories (board_id, title, position) VALUES (?, ?, ?)', [
          boardId,
          String(cat.title || 'Category'),
          Number(cat.position ?? ci)
        ]);
        categoryId = res.insertId;
      }

      const questions = Array.isArray(cat.questions) ? cat.questions : [];
      const keepQuestionIds = questions.filter((q: any) => q.id).map((q: any) => Number(q.id));
      if (keepQuestionIds.length) {
        await conn.query(`DELETE FROM questions WHERE category_id = ? AND id NOT IN (${keepQuestionIds.map(() => '?').join(',')})`, [
          categoryId,
          ...keepQuestionIds
        ]);
      } else {
        await conn.query('DELETE FROM questions WHERE category_id = ?', [categoryId]);
      }

      for (let qi = 0; qi < questions.length; qi++) {
        const q = questions[qi];
        if (q.id) {
          await conn.query(
            'UPDATE questions SET value = ?, question = ?, answer = ?, is_daily_double = ?, position = ? WHERE id = ? AND category_id = ?',
            [
              Number(q.value || 0),
              String(q.question || ''),
              String(q.answer || ''),
              !!q.isDailyDouble,
              Number(q.position ?? qi),
              Number(q.id),
              categoryId
            ]
          );
        } else {
          await conn.query(
            'INSERT INTO questions (category_id, value, question, answer, is_daily_double, position) VALUES (?, ?, ?, ?, ?, ?)',
            [
              categoryId,
              Number(q.value || 0),
              String(q.question || ''),
              String(q.answer || ''),
              !!q.isDailyDouble,
              Number(q.position ?? qi)
            ]
          );
        }
      }
    }

    await conn.commit();
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    await conn.rollback();
    return new Response(JSON.stringify({ error: 'Failed to save board' }), { status: 500 });
  } finally {
    conn.release();
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.host) return new Response('Unauthorized', { status: 401 });
  const boardId = Number(params.id);
  await query('DELETE FROM boards WHERE id = ? AND host_id = ?', [boardId, locals.host.hostId]);
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
