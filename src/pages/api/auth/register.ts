import type { APIRoute } from 'astro';
import { HOST_COOKIE, hashPassword, issueHostToken } from '@/lib/auth';
import { query } from '@/lib/db';

export const POST: APIRoute = async ({ request, cookies }) => {
  const { email, password } = await request.json();
  if (!email || !password || password.length < 6) {
    return new Response(JSON.stringify({ error: 'Email and password (min 6) required.' }), { status: 400 });
  }

  try {
    const passwordHash = await hashPassword(password);
    const result = await query<any>('INSERT INTO hosts (email, password_hash) VALUES (?, ?)', [
      String(email).toLowerCase(),
      passwordHash
    ]);
    const hostId = result.insertId as number;
    const token = await issueHostToken(hostId, String(email).toLowerCase());
    cookies.set(HOST_COOKIE, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.code === 'ER_DUP_ENTRY' ? 'Email already in use.' : 'Register failed.' }), {
      status: 400
    });
  }
};
