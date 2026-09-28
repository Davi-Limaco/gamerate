import type { NextFunction, Request, Response } from 'express';

import Avaliacao from '@/models/avaliacao.model.ts';
import HttpError from '@/errors/HttpError.ts';

/**
 * Protege PUT/DELETE /avaliacoes/:id: apenas o autor original da avaliação
 * (comparado via req.usuario.id, vindo do JWT) ou um Administrador podem
 * editá-la ou removê-la. Deve vir depois de `authenticate` na cadeia.
 */
export async function requireAvaliacaoOwnerOrAdmin(req: Request<{ id: string }>, _res: Response, next: NextFunction) {
  if (!req.usuario) {
    throw new HttpError('Não autenticado', 401);
  }

  const avaliacao = await Avaliacao.readById(Number(req.params.id));
  const isAutor = avaliacao.id_usuario_fk === req.usuario.id;
  const isAdmin = req.usuario.perfil === 'Administrador';

  if (!isAutor && !isAdmin) {
    throw new HttpError('Você só pode alterar ou remover as suas próprias avaliações', 403);
  }

  next();
}
