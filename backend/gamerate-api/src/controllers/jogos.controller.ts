import type { Request, Response } from 'express';

import Jogo from '@/models/jogo.model.ts';
import HttpError from '@/errors/HttpError.ts';
import type { JogoFilter, JogoInput } from '@/types/Jogo.d.ts';

async function getStats(_req: Request, res: Response<unknown>) {
  try {
    res.json(await Jogo.getStats());
  } catch (error) {
    throw new HttpError('Erro ao buscar estatísticas', 500);
  }
}

async function getDestaques(_req: Request, res: Response<unknown>) {
  try {
    res.json(await Jogo.getDestaques());
  } catch (error) {
    throw new HttpError('Erro ao buscar destaques', 500);
  }
}

async function read(req: Request<Record<string, string>, unknown, unknown, JogoFilter>, res: Response<unknown>) {
  try {
    const { search, genero, plataforma } = req.query;
    const jogos = await Jogo.readAll({ search, genero, plataforma });
    res.json({ total: jogos.length, jogos });
  } catch (error) {
    throw new HttpError('Erro ao listar jogos', 500);
  }
}

async function readById(req: Request<{ id: string }, unknown>, res: Response<unknown>) {
  try {
    res.json(await Jogo.readById(Number(req.params.id)));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao buscar jogo', 500);
  }
}

async function create(req: Request<Record<string, string>, unknown, JogoInput>, res: Response<unknown>) {
  try {
    const jogo = req.body;
    res.status(201).json(await Jogo.create(jogo));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao criar jogo', 500);
  }
}

async function update(req: Request<{ id: string }, unknown, JogoInput>, res: Response<unknown>) {
  try {
    const jogo = req.body;
    const { id } = req.params;

    res.json(await Jogo.update({ ...jogo, id: Number(id) }));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao atualizar jogo', 500);
  }
}

async function remove(req: Request<{ id: string }, unknown>, res: Response<unknown>) {
  try {
    if (await Jogo.remove(Number(req.params.id))) return res.sendStatus(204);
    throw new HttpError('Jogo não encontrado', 404);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao remover jogo', 500);
  }
}

export default { getStats, getDestaques, read, readById, create, update, remove };
