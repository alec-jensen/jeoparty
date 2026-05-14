import type { APIContext } from 'astro';
import { HOST_COOKIE, verifyHostToken } from '@/lib/auth';

const protectedPrefixes = ['/dashboard', '/boards', '/api/boards', '/api/games/create'];

function requiresHost(pathname: string) {
  // Game host controls require auth; presenter and player views do not
  if (pathname.startsWith('/game/') && pathname.endsWith('/host')) return true;
  if (pathname.startsWith('/game/') && pathname.endsWith('/play')) return false;
  if (pathname.startsWith('/game/') && !pathname.endsWith('/host')) return false;
  if (pathname.startsWith('/api/games/') && pathname.endsWith('/join')) return false;
  if (pathname.startsWith('/api/auth')) return false;
  if (pathname === '/join') return false;
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
  if (!host) {
    const loginUrl = new URL('/', context.url);
    loginUrl.searchParams.set('showLogin', '1');

    const nextPath = `${context.url.pathname}${context.url.search}`;
    if (nextPath && nextPath !== '/') {
      loginUrl.searchParams.set('next', nextPath);
    }

    return Response.redirect(loginUrl, 302);
  }
  context.locals.host = { hostId: host.hostId, email: host.email, tokenId: host.tokenId };
  return null;
}
