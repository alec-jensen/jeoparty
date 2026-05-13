import type { APIRoute } from 'astro';
import { query } from '@/lib/db';

export const GET: APIRoute = async ({ locals }) => {
  const host = locals.host;
  if (!host) return new Response('Unauthorized', { status: 401 });
  const rows = await query<any[]>('SELECT id, title, created_at, updated_at FROM boards WHERE host_id = ? ORDER BY updated_at DESC', [
    host.hostId
  ]);
  return new Response(JSON.stringify(rows), { status: 200 });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const host = locals.host;
  if (!host) return new Response('Unauthorized', { status: 401 });
  const body = await request.json();
  const title = String(body.title || 'New Board').trim();
  const result = await query<any>('INSERT INTO boards (host_id, title) VALUES (?, ?)', [host.hostId, title]);
  const boardId = result.insertId as number;

  const categories = Array.isArray(body.categories)
    ? body.categories
    : Array.from({ length: 6 }, (_, i) => ({
        title: `Category ${i + 1}`,
        position: i,
        questions: Array.from({ length: 5 }, (_, qi) => ({
          value: (qi + 1) * 200,
          question: 'Question text',
          answer: 'Answer text',
          isDailyDouble: false,
          position: qi
        }))
      }));

  for (const category of categories) {
    const catRes = await query<any>('INSERT INTO categories (board_id, title, position) VALUES (?, ?, ?)', [
      boardId,
      String(category.title || 'Category'),
      Number(category.position || 0)
    ]);
    const categoryId = catRes.insertId as number;
    for (const q of category.questions || []) {
      await query('INSERT INTO questions (category_id, value, question, answer, is_daily_double, position) VALUES (?, ?, ?, ?, ?, ?)', [
        categoryId,
        Number(q.value || 200),
        String(q.question || ''),
        String(q.answer || ''),
        !!q.isDailyDouble,
        Number(q.position || 0)
      ]);
    }
  }

  return new Response(JSON.stringify({ id: boardId }), { status: 201 });
};
