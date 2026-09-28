import jwt from 'jsonwebtoken';

import HttpError from '@/errors/HttpError.ts';
import type { AuthTokenPayload } from '@/types/Auth.d.ts';

// A aplicação não sobe sem um JWT_SECRET configurado: assinar tokens com um
// segredo padrão "adivinhável" (ex.: string vazia) permitiria a qualquer um
// forjar tokens válidos. Falha rápido e explícito é preferível a rodar de
// forma insegura. A checagem fica numa função para o TypeScript conseguir
// tratar o valor como `string` (não `string | undefined`) daqui em diante.
function readSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não configurado. Defina a variável de ambiente antes de iniciar a API.');
  }
  return secret;
}

const JWT_SECRET: string = readSecret();

// Tempo de vida do token de sessão. Curto o suficiente para limitar o estrago
// de um token vazado, longo o suficiente para não incomodar o usuário durante
// o uso normal da aplicação.
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

/** Assina um novo JWT contendo o id do usuário e seu perfil atual. */
export function signToken(payload: AuthTokenPayload): string {
  const options: jwt.SignOptions = { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verifica e decodifica um JWT. Lança HttpError 401 (não HttpError 500) para
 * qualquer token ausente, expirado ou adulterado, já que do ponto de vista do
 * cliente todos esses casos significam "sua sessão não é mais válida".
 */
export function verifyToken(token: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === 'string' || typeof decoded.sub !== 'number' || typeof decoded.perfil !== 'string') {
      throw new Error('payload de token em formato inesperado');
    }
    return { sub: decoded.sub, perfil: decoded.perfil };
  } catch {
    throw new HttpError('Sessão inválida ou expirada. Faça login novamente.', 401);
  }
}
