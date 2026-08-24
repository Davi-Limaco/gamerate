// @ts-ignore - argon2Sync is available in Node.js 23.4.0+
import { argon2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

type Argon2Algorithm = 'argon2d' | 'argon2i' | 'argon2id';

const ALGORITHM: Argon2Algorithm = 'argon2id';
const VERSION = 19;
const KEY_LENGTH = 64;
const MEMORY_KIB = 65536;
const PASSES = 3;
const PARALLELISM = 4;

const PHC_REGEX =
  /^\$(argon2(?:d|i|id))\$v=(\d+)\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/;

function toBase64(buffer: Buffer): string {
  return buffer.toString('base64').replace(/=+$/, '');
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = argon2Sync(ALGORITHM, {
    message: password,
    nonce: salt,
    parallelism: PARALLELISM,
    tagLength: KEY_LENGTH,
    memory: MEMORY_KIB,
    passes: PASSES,
  });

  return `$${ALGORITHM}$v=${VERSION}$m=${MEMORY_KIB},t=${PASSES},p=${PARALLELISM}$${toBase64(salt)}$${toBase64(hash)}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const match = storedHash.match(PHC_REGEX);

  if (!match) {
    return false;
  }

  const [, algorithm, version, memory, passes, parallelism, saltB64, hashB64] =
    match;

  if (Number(version) !== VERSION) {
    return false;
  }

  const hashBuffer = Buffer.from(hashB64, 'base64');

  try {
    const derivedBuffer = argon2Sync(algorithm as Argon2Algorithm, {
      message: password,
      nonce: Buffer.from(saltB64, 'base64'),
      parallelism: Number(parallelism),
      tagLength: hashBuffer.length,
      memory: Number(memory),
      passes: Number(passes),
    });

    return (
      hashBuffer.length === derivedBuffer.length &&
      timingSafeEqual(hashBuffer, derivedBuffer)
    );
  } catch {
    return false;
  }
}
