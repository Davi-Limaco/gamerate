import type { NextFunction, Request, Response } from 'express';

import HttpError from '@/errors/HttpError.ts';
import { verifyToken } from '@/utils/jwt.ts';

/**
 * Middleware de autenticação obrigatória.
 *
 * Lê o header `Authorization: Bearer <token>`, valida o JWT e, em caso de
 * sucesso, preenche `req.usuario` com `{ id, perfil }` para uso pelos
 * Controllers/Models seguintes na cadeia (ex.: para restringir uma consulta
 * ao próprio usuário, ou decidir o autor de uma avaliação a partir do token
 * em vez de confiar em um campo enviado pelo cliente).
 *
 * Qualquer ausência ou invalidade do token (sem header, formato errado,
 * assinatura inválida, token expirado) resulta em 401 — a rota protegida
 * nunca é alcançada.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new HttpError('Não autenticado: token ausente', 401);
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw new HttpError('Não autenticado: token ausente', 401);
  }

  const payload = verifyToken(token);
  req.usuario = { id: payload.sub, perfil: payload.perfil };

  next();
}
