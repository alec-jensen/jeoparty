import type { APIRoute } from 'astro';
import { HOST_COOKIE, hashPassword, issueHostToken } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, cookies }) => {
  if (process.env.DISABLE_REGISTRATION === 'true') {
    return new Response(JSON.stringify({ error: 'Registration is disabled.' }), { status: 403 });
  }

  const { email, password } = await request.json();
  if (!email || !password) return new Response(JSON.stringify({ error: 'Email and password required.' }), { status: 400 });
  if (String(password).length < 6) return new Response(JSON.stringify({ error: 'Password must be at least 6 characters.' }), { status: 400 });

  const existing = await db.select({ id: schema.hosts.id })
    .from(schema.hosts)
    .where(eq(schema.hosts.email, String(email).toLowerCase().trim()));
  if (existing.length) return new Response(JSON.stringify({ error: 'Email already registered.' }), { status: 409 });

  const passwordHash = await hashPassword(String(password));
  const [{ id: hostId }] = await db.insert(schema.hosts)
    .values({ email: String(email).toLowerCase().trim(), passwordHash })
    .$returningId();

  const token = await issueHostToken(hostId, String(email).toLowerCase().trim());
  cookies.set(HOST_COOKIE, token, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 });
  return new Response(JSON.stringify({ ok: true }), { status: 201 });
};
