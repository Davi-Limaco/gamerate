import type { Request, Response } from 'express';

import HttpError from '@/errors/HttpError.ts';
import Midia from '@/models/midia.model.ts';
import type { MidiaFilter, MidiaInput, TipoMidia } from '@/types/Midia.d.ts';
import { removeMidiaByPublicPath, toPublicMidiaPath } from '@/utils/uploads.ts';

/** GET /midias — lista pública, com filtros (já validados) em req.query. */
async function read(req: Request<Record<string, string>, unknown, unknown, Record<string, unknown>>, res: Response<unknown>) {
  try {
    const { tipo, usuario_id, jogo_id, limit } = req.query;
    const filtro: MidiaFilter = {
      ...(tipo ? { tipo: tipo as TipoMidia } : {}),
      ...(usuario_id ? { usuario_id: Number(usuario_id) } : {}),
      ...(jogo_id ? { jogo_id: Number(jogo_id) } : {}),
      ...(limit ? { limit: Number(limit) } : {}),
    };
    res.json(await Midia.readAll(filtro));
  } catch (error) {
    throw new HttpError('Erro ao buscar mídias', 500);
  }
}

async function readById(req: Request<{ id: string }>, res: Response<unknown>) {
  try {
    res.json(await Midia.readById(Number(req.params.id)));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao buscar mídia', 500);
  }
}

/**
 * POST /midias — o arquivo já foi aceito pelo Multer e os campos de texto
 * validados pelo `validate`. Se o banco recusar (ex.: jogo inexistente -> 404),
 * o middleware de erros apaga o arquivo recém-gravado.
 */
async function create(req: Request<Record<string, string>, unknown, MidiaInput>, res: Response<unknown>) {
  try {
    const caminho = toPublicMidiaPath(req.file!.filename);
    const midia = await Midia.create(req.usuario!.id, res.locals.tipoMidia as TipoMidia, caminho, req.body);
    res.status(201).json(midia);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao salvar mídia', 500);
  }
}

async function update(req: Request<{ id: string }, unknown, Partial<MidiaInput>>, res: Response<unknown>) {
  try {
    res.json(await Midia.update(Number(req.params.id), req.body));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao atualizar mídia', 500);
  }
}

async function remove(req: Request<{ id: string }>, res: Response<unknown>) {
  try {
    const caminho = await Midia.remove(Number(req.params.id));
    await removeMidiaByPublicPath(caminho);
    res.sendStatus(204);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao remover mídia', 500);
  }
}

export default { read, readById, create, update, remove };
