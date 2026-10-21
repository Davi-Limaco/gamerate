import type { Request, Response } from 'express';

import HttpError from '@/errors/HttpError.ts';
import Favorito from '@/models/favorito.model.ts';

/** GET /favoritos — jogos favoritos do usuário autenticado. */
async function read(req: Request, res: Response<unknown>) {
  try {
    res.json(await Favorito.readByUsuario(req.usuario!.id));
  } catch (error) {
    throw new HttpError('Erro ao buscar favoritos', 500);
  }
}

/** POST /favoritos — adiciona um jogo do catálogo aos favoritos (201). */
async function create(req: Request<Record<string, string>, unknown, { id_jogo_fk: number }>, res: Response<unknown>) {
  try {
    res.status(201).json(await Favorito.create(req.usuario!.id, req.body.id_jogo_fk));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao favoritar jogo', 500);
  }
}

/** DELETE /favoritos/:id_jogo — remove o jogo dos favoritos (204). */
async function remove(req: Request<{ id_jogo: string }>, res: Response<unknown>) {
  try {
    await Favorito.remove(req.usuario!.id, Number(req.params.id_jogo));
    res.sendStatus(204);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao remover favorito', 500);
  }
}

export default { read, create, remove };
