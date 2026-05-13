import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

const jwtSecret: string = (() => {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('JWT_SECRET is required');
  return value;
})();

export const HOST_COOKIE = 'jeoparty_host_token';
export const PLAYER_COOKIE = 'jeoparty_player_token';

export interface HostJwtPayload {
  hostId: number;
  email: string;
  tokenId: number;
}

export interface PlayerJwtPayload {
  playerId: string;
  gameId: string;
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function issueHostToken(hostId: number, email: string) {
  const [{ id: tokenId }] = await db
    .insert(schema.authTokens)
    .values({ hostId, tokenHash: '' })
    .$returningId();

  const token = jwt.sign({ hostId, email, tokenId }, jwtSecret, { expiresIn: '7d' });
  await db
    .update(schema.authTokens)
    .set({ tokenHash: hashToken(token) })
    .where(eq(schema.authTokens.id, tokenId));
  return token;
}

export function verifyJwt<T>(token: string) {
  return jwt.verify(token, jwtSecret) as T;
}

export async function verifyHostToken(token: string): Promise<HostJwtPayload | null> {
  try {
    const payload = verifyJwt<HostJwtPayload>(token);
    const rows = await db
      .select({ id: schema.authTokens.id })
      .from(schema.authTokens)
      .where(
        and(
          eq(schema.authTokens.id, payload.tokenId),
          eq(schema.authTokens.hostId, payload.hostId),
          eq(schema.authTokens.tokenHash, hashToken(token))
        )
      );
    return rows.length ? payload : null;
  } catch {
    return null;
  }
}

export function issuePlayerToken(playerId: string, gameId: string) {
  return jwt.sign({ playerId, gameId }, jwtSecret, { expiresIn: '7d' });
}

export function verifyPlayerToken(token: string): PlayerJwtPayload | null {
  try {
    return verifyJwt<PlayerJwtPayload>(token);
  } catch {
    return null;
  }
}

export async function revokeHostToken(payload: HostJwtPayload) {
  await db
    .delete(schema.authTokens)
    .where(
      and(
        eq(schema.authTokens.id, payload.tokenId),
        eq(schema.authTokens.hostId, payload.hostId)
      )
    );
}

export function cookieOptions(maxAgeSec = 7 * 24 * 60 * 60) {
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}`;
}
