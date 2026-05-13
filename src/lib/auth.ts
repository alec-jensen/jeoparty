import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash, randomUUID } from 'node:crypto';
import { query } from '@/lib/db';

function jwtSecret() {
  return process.env.JWT_SECRET ?? 'changeme';
}

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
  const preToken = jwt.sign({ hostId, email, tokenId: 0 }, jwtSecret(), { expiresIn: '7d' });
  const tokenHash = hashToken(preToken + randomUUID());
  const result = await query<any>('INSERT INTO auth_tokens (host_id, token_hash) VALUES (?, ?)', [hostId, tokenHash]);
  const tokenId = result.insertId as number;
  const token = jwt.sign({ hostId, email, tokenId }, jwtSecret(), { expiresIn: '7d' });
  await query('UPDATE auth_tokens SET token_hash = ? WHERE id = ?', [hashToken(token), tokenId]);
  return token;
}

export function verifyJwt<T>(token: string) {
  return jwt.verify(token, jwtSecret()) as T;
}

export async function verifyHostToken(token: string): Promise<HostJwtPayload | null> {
  try {
    const payload = verifyJwt<HostJwtPayload>(token);
    const rows = await query<any[]>('SELECT id FROM auth_tokens WHERE id = ? AND host_id = ? AND token_hash = ?', [
      payload.tokenId,
      payload.hostId,
      hashToken(token)
    ]);
    return rows.length ? payload : null;
  } catch {
    return null;
  }
}

export function issuePlayerToken(playerId: string, gameId: string) {
  return jwt.sign({ playerId, gameId }, jwtSecret(), { expiresIn: '7d' });
}

export function verifyPlayerToken(token: string): PlayerJwtPayload | null {
  try {
    return verifyJwt<PlayerJwtPayload>(token);
  } catch {
    return null;
  }
}

export async function revokeHostToken(payload: HostJwtPayload) {
  await query('DELETE FROM auth_tokens WHERE id = ? AND host_id = ?', [payload.tokenId, payload.hostId]);
}

export function cookieOptions(maxAgeSec = 7 * 24 * 60 * 60) {
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}`;
}
