import type { APIContext } from 'astro';
import { HOST_COOKIE, verifyHostToken } from '@/lib/auth';

const protectedPrefixes = ['/dashboard', '/boards', '/game', '/api/boards', '/api/games/create'];

function requiresHost(pathname: string) {
  if (pathname.startsWith('/game/') && pathname.endsWith('/play')) return false;
  if (pathname.startsWith('/api/games/') && pathname.endsWith('/join')) return false;
  if (pathname.startsWith('/api/auth')) return false;
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}

export async function requireHost(context: APIContext) {
  const token = context.cookies.get(HOST_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyHostToken(token);
  return payload;
}

export async function runAuth(context: APIContext) {
  if (!requiresHost(context.url.pathname)) return null;
  const host = await requireHost(context);
  if (!host) return Response.redirect(new URL('/', context.url), 302);
  context.locals.host = { hostId: host.hostId, email: host.email, tokenId: host.tokenId };
  return null;
}
