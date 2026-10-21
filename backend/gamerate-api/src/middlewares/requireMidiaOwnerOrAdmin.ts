import type { NextFunction, Request, Response } from 'express';

import HttpError from '@/errors/HttpError.ts';
import Midia from '@/models/midia.model.ts';

/**
 * Protege PUT/DELETE /midias/:id: só o autor da mídia (comparado via
 * req.usuario.id, vindo do JWT) ou um Administrador (moderação). Responde 404
 * se a mídia não existe. Deve vir depois de `authenticate` e do `validate`.
 */
export async function requireMidiaOwnerOrAdmin(req: Request<{ id: string }>, _res: Response, next: NextFunction) {
  if (!req.usuario) throw new HttpError('Não autenticado', 401);

  const midia = await Midia.readById(Number(req.params.id));
  if (midia.id_usuario_fk !== req.usuario.id && req.usuario.perfil !== 'Administrador') {
    throw new HttpError('Você só pode alterar ou remover as suas próprias mídias', 403);
  }
  next();
}
