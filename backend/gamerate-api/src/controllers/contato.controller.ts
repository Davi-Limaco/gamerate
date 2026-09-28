import type { Request, Response } from 'express';

import Contato from '@/models/contato.model.ts';
import HttpError from '@/errors/HttpError.ts';
import type { ContatoInput } from '@/types/Contato.d.ts';

async function read(_req: Request, res: Response<unknown>) {
  try {
    res.json(await Contato.readAll());
  } catch (error) {
    throw new HttpError('Erro ao listar contatos', 500);
  }
}

async function create(req: Request<Record<string, string>, unknown, ContatoInput>, res: Response<unknown>) {
  try {
    const contato = req.body;
    res.status(201).json(await Contato.create(contato));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao registrar contato', 500);
  }
}

async function remove(req: Request<{ id: string }, unknown>, res: Response<unknown>) {
  try {
    if (await Contato.remove(Number(req.params.id))) return res.sendStatus(204);
    throw new HttpError('Contato não encontrado', 404);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao remover contato', 500);
  }
}

export default { read, create, remove };
