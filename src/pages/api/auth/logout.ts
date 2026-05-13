import type { APIRoute } from 'astro';
import { HOST_COOKIE, revokeHostToken, verifyJwt, type HostJwtPayload } from '@/lib/auth';

export const POST: APIRoute = async ({ cookies }) => {
  const token = cookies.get(HOST_COOKIE)?.value;
  if (token) {
    try {
      const payload = verifyJwt<HostJwtPayload>(token);
      await revokeHostToken(payload);
    } catch {
      // no-op
    }
  }
  cookies.delete(HOST_COOKIE, { path: '/' });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
