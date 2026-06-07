import type { Request, Response } from 'express';

import Jogo from '@/models/jogo.model.js';
import HttpError from '@/errors/HttpError.js';
import type { JogoFilter, JogoInput } from '@/types/Jogo.d.ts';

async function getStats(req: Request, res: Response) {
  try {
    res.json(await Jogo.getStats());
  } catch (error) {
    throw new HttpError('Erro ao buscar estatísticas', 500);
  }
}

async function getDestaques(req: Request, res: Response) {
  try {
    res.json(await Jogo.getDestaques());
  } catch (error) {
    throw new HttpError('Erro ao buscar destaques', 500);
  }
}

async function read(req: Request, res: Response) {
  try {
    const { search, genero, plataforma } = req.query as JogoFilter;
    const jogos = await Jogo.readAll({ search, genero, plataforma });
    res.json({ total: jogos.length, jogos });
  } catch (error) {
    throw new HttpError('Erro ao listar jogos', 500);
  }
}

async function readById(req: Request<{ id: string }>, res: Response) {
  try {
    res.json(await Jogo.readById(Number(req.params.id)));
  } catch (error) {
    throw new HttpError('Jogo não encontrado', 404);
  }
}

async function create(req: Request, res: Response) {
  try {
    const jogo = req.body as JogoInput;
    res.status(201).json(await Jogo.create(jogo));
  } catch (error) {
    throw new HttpError('Erro ao criar jogo', 400);
  }
}

async function update(req: Request<{ id: string }>, res: Response) {
  try {
    const jogo = req.body as JogoInput;
    const { id } = req.params;

    res.json(await Jogo.update({ ...jogo, id: Number(id) }));
  } catch (error) {
    throw new HttpError('Erro ao atualizar jogo', 400);
  }
}

async function remove(req: Request<{ id: string }>, res: Response) {
  try {
    if (await Jogo.remove(Number(req.params.id))) return res.sendStatus(204);
    throw new HttpError('Jogo não encontrado', 404);
  } catch (error) {
    throw new HttpError('Erro ao remover jogo', 400);
  }
}

export default { getStats, getDestaques, read, readById, create, update, remove };
