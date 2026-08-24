import { createHmac, timingSafeEqual } from 'node:crypto';

export interface JwtPayload {
  userId: number;
  nome?: string;
  email?: string;
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'gamerate-api-dev-secret';
const DEFAULT_EXPIRES_IN_SECONDS = 60 * 60 * 24;

function toBase64Url(value: Buffer | string): string {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);

  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromBase64Url(value: string): Buffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);

  return Buffer.from(base64 + padding, 'base64');
}

function sign(data: string): string {
  return toBase64Url(createHmac('sha256', JWT_SECRET).update(data).digest());
}

export function signJwt(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  expiresInSeconds = DEFAULT_EXPIRES_IN_SECONDS,
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(tokenPayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  return `${data}.${sign(data)}`;
}

export function verifyJwt(token: string): JwtPayload {
  const [encodedHeader, encodedPayload, signature] = token.split('.');

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error('Invalid token');
  }

  const data = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = sign(data);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    throw new Error('Invalid token signature');
  }

  const header = JSON.parse(fromBase64Url(encodedHeader).toString());

  if (header.alg !== 'HS256' || header.typ !== 'JWT') {
    throw new Error('Invalid token header');
  }

  const payload = JSON.parse(fromBase64Url(encodedPayload).toString());
  const now = Math.floor(Date.now() / 1000);

  if (!payload.userId || !payload.exp || payload.exp < now) {
    throw new Error('Expired or invalid token');
  }

  return payload as JwtPayload;
}
