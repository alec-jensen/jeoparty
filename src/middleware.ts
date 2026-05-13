import type { MiddlewareHandler } from 'astro';
import { runAuth, requireHost } from '@/middleware/auth';

// Simple in-memory rate limiter (per IP, sliding window)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 120; // 120 requests per minute per IP

function getIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Periodically clean expired entries to prevent unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60_000);

export const onRequest: MiddlewareHandler = async (context, next) => {
  // Rate limit API routes only — never gameplay WebSocket traffic
  const { pathname } = context.url;
  if (pathname.startsWith('/api/')) {
    const ip = getIp(context.request);
    if (isRateLimited(ip)) {
      return new Response(JSON.stringify({ error: 'Too many requests.' }), {
        status: 429,
        headers: { 'content-type': 'application/json', 'retry-after': '60' },
      });
    }
  }

  const redirect = await runAuth(context);
  if (redirect) return redirect;

  if (!context.locals.host) {
    const host = await requireHost(context);
    if (host) context.locals.host = { hostId: host.hostId, email: host.email, tokenId: host.tokenId };
  }

  return next();
};
