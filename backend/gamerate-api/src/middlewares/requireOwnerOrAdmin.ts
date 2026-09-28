import type { NextFunction, Request, Response } from 'express';

import HttpError from '@/errors/HttpError.ts';

/**
 * Middleware de proteção de recurso por propriedade.
 *
 * Usado em rotas como `/usuarios/:id`, onde a regra de negócio não é apenas
 * "precisa estar autenticado" (isso já é `authenticate`), mas "só o próprio
 * usuário — ou um Administrador — pode acessar/alterar este registro
 * específico". Deve vir sempre depois de `authenticate` na cadeia da rota.
 *
 * Compara `req.usuario.id` (do JWT) com o `:id` da URL; usuários com perfil
 * "Administrador" têm acesso liberado independentemente do dono.
 */
export function requireOwnerOrAdmin(req: Request<{ id: string }>, _res: Response, next: NextFunction) {
  if (!req.usuario) {
    throw new HttpError('Não autenticado', 401);
  }

  const donoDoRecurso = req.usuario.id === Number(req.params.id);
  const isAdmin = req.usuario.perfil === 'Administrador';

  if (!donoDoRecurso && !isAdmin) {
    throw new HttpError('Você não tem permissão para acessar este recurso', 403);
  }

  next();
}
