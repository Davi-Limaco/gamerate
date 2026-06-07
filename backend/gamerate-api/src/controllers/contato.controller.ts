import type { Request, Response } from 'express';

import Contato from '@/models/contato.model.js';
import HttpError from '@/errors/HttpError.js';
import type { ContatoInput } from '@/types/Contato.d.ts';

async function read(req: Request, res: Response) {
  try {
    res.json(await Contato.readAll());
  } catch (error) {
    throw new HttpError('Erro ao listar contatos', 500);
  }
}

async function create(req: Request, res: Response) {
  try {
    const contato = req.body as ContatoInput;
    res.status(201).json(await Contato.create(contato));
  } catch (error) {
    throw new HttpError('Erro ao registrar contato', 400);
  }
}

async function remove(req: Request<{ id: string }>, res: Response) {
  try {
    if (await Contato.remove(Number(req.params.id))) return res.sendStatus(204);
    throw new HttpError('Contato não encontrado', 404);
  } catch (error) {
    throw new HttpError('Erro ao remover contato', 400);
  }
}

export default { read, create, remove };
