import type { APIRoute } from 'astro';
import { HOST_COOKIE, issueHostToken, verifyPassword } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, cookies }) => {
  const { email, password } = await request.json();
  if (!email || !password) return new Response(JSON.stringify({ error: 'Email and password required.' }), { status: 400 });

  const rows = await db.select({ id: schema.hosts.id, email: schema.hosts.email, passwordHash: schema.hosts.passwordHash })
    .from(schema.hosts)
    .where(eq(schema.hosts.email, String(email).toLowerCase().trim()));

  if (!rows.length) return new Response(JSON.stringify({ error: 'Invalid login.' }), { status: 401 });
  const host = rows[0];
  const valid = await verifyPassword(String(password), host.passwordHash);
  if (!valid) return new Response(JSON.stringify({ error: 'Invalid login.' }), { status: 401 });

  const token = await issueHostToken(host.id, host.email);
  cookies.set(HOST_COOKIE, token, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
