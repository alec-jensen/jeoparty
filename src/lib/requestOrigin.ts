function firstHeaderValue(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(',')[0]?.trim();
  return first || null;
}

function parseForwardedHeader(value: string | null): { host?: string; proto?: string } {
  const firstPart = firstHeaderValue(value);
  if (!firstPart) return {};

  // RFC 7239 format: Forwarded: proto=https;host=example.com
  const parts = firstPart.split(';').map((part) => part.trim());
  const result: { host?: string; proto?: string } = {};

  for (const part of parts) {
    const [rawKey, rawValue] = part.split('=', 2);
    if (!rawKey || !rawValue) continue;

    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim().replace(/^"|"$/g, '');
    if (!value) continue;

    if (key === 'host') result.host = value;
    if (key === 'proto') result.proto = value;
  }

  return result;
}

function normalizeProto(value: string | undefined, fallback: string): string {
  const proto = (value ?? '').trim().toLowerCase();
  if (proto === 'http' || proto === 'https') return proto;
  return fallback;
}

function normalizeHost(value: string | undefined, fallback: string): string {
  const candidate = (value ?? '').trim();
  if (!candidate) return fallback;

  // Keep host:port style values and drop anything that could break URL construction.
  if (/^[a-z0-9.\-:\[\]]+$/i.test(candidate)) return candidate;
  return fallback;
}

export function getPublicOrigin(request: Request, fallbackUrl: URL): string {
  // Explicit env var wins — required when accessing via localhost but players join via LAN/domain
  const envOrigin = (process.env.PUBLIC_ORIGIN ?? '').trim();
  if (envOrigin) {
    try {
      const u = new URL(envOrigin);
      return `${u.protocol}//${u.host}`;
    } catch {
      // fall through to header detection
    }
  }

  const forwarded = parseForwardedHeader(request.headers.get('forwarded'));
  const headerProto = firstHeaderValue(request.headers.get('x-forwarded-proto'));
  const headerHost = firstHeaderValue(request.headers.get('x-forwarded-host'));
  const directHost = request.headers.get('host')?.trim() || '';

  const fallbackProto = fallbackUrl.protocol.replace(':', '') || 'http';
  const proto = normalizeProto(forwarded.proto ?? headerProto ?? undefined, fallbackProto);

  const fallbackHost = fallbackUrl.host || directHost;
  const host = normalizeHost(forwarded.host ?? headerHost ?? directHost, fallbackHost);

  return `${proto}://${host}`;
}