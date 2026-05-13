import type { MiddlewareHandler } from 'astro';
import { runAuth, requireHost } from '@/middleware/auth';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const redirect = await runAuth(context);
  if (redirect) return redirect;

  const host = await requireHost(context);
  if (host) context.locals.host = { hostId: host.hostId, email: host.email, tokenId: host.tokenId };

  return next();
};
