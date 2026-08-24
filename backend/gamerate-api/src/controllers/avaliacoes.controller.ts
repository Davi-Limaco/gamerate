import type { Request, Response } from 'express';

import Avaliacao from '@/models/avaliacao.model.ts';
import HttpError from '@/errors/HttpError.ts';
import type { AvaliacaoFilter, AvaliacaoInput } from '@/types/Avaliacao.d.ts';

async function read(req: Request, res: Response) {
  try {
    const { jogo_id } = req.query as { jogo_id?: string };
    const filter: AvaliacaoFilter = jogo_id ? { jogo_id: Number(jogo_id) } : {};
    const result = await Avaliacao.readAll(filter);
    res.json({ total: result.length, avaliacoes: result });
  } catch (error) {
    throw new HttpError('Erro ao listar avaliações', 500);
  }
}

async function getDestaque(req: Request, res: Response) {
  try {
    res.json(await Avaliacao.getDestaque());
  } catch (error) {
    throw new HttpError('Erro ao buscar destaques', 500);
  }
}

async function readById(req: Request<{ id: string }>, res: Response) {
  try {
    res.json(await Avaliacao.readById(Number(req.params.id)));
  } catch (error) {
    throw new HttpError('Avaliação não encontrada', 404);
  }
}

async function create(req: Request, res: Response) {
  try {
    if (!req.userId) throw new HttpError('Usuário não autenticado', 401);

    const { id_jogo_fk, nota, titulo, texto } = req.body as AvaliacaoInput;
    res.status(201).json(await Avaliacao.create({
      id_usuario_fk: req.userId,
      id_jogo_fk,
      nota,
      titulo,
      texto,
    }));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao criar avaliação', 400);
  }
}

async function update(req: Request<{ id: string }>, res: Response) {
  try {
    const avaliacao = req.body as AvaliacaoInput;
    const { id } = req.params;

    res.json(await Avaliacao.update({ ...avaliacao, id: Number(id) }));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao atualizar avaliação', 400);
  }
}

async function remove(req: Request<{ id: string }>, res: Response) {
  try {
    if (await Avaliacao.remove(Number(req.params.id))) return res.sendStatus(204);
    throw new HttpError('Avaliação não encontrada', 404);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao remover avaliação', 400);
  }
}

export default { getDestaque, read, readById, create, update, remove };
