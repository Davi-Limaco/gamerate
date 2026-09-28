import type { Request, Response } from 'express';

import Avaliacao from '@/models/avaliacao.model.ts';
import HttpError from '@/errors/HttpError.ts';
import type { AvaliacaoFilter, AvaliacaoInput } from '@/types/Avaliacao.d.ts';

async function read(req: Request<Record<string, string>, unknown, unknown, { jogo_id?: string }>, res: Response<unknown>) {
  try {
    const { jogo_id } = req.query;
    const filter: AvaliacaoFilter = jogo_id ? { jogo_id: Number(jogo_id) } : {};
    const result = await Avaliacao.readAll(filter);
    res.json({ total: result.length, avaliacoes: result });
  } catch (error) {
    throw new HttpError('Erro ao listar avaliações', 500);
  }
}

async function getDestaque(_req: Request, res: Response<unknown>) {
  try {
    res.json(await Avaliacao.getDestaque());
  } catch (error) {
    throw new HttpError('Erro ao buscar destaques', 500);
  }
}

async function readById(req: Request<{ id: string }, unknown>, res: Response<unknown>) {
  try {
    res.json(await Avaliacao.readById(Number(req.params.id)));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao buscar avaliação', 500);
  }
}

async function create(req: Request<Record<string, string>, unknown, AvaliacaoInput>, res: Response<unknown>) {
  try {
    // O autor da avaliação é sempre o usuário autenticado (req.usuario.id,
    // populado pelo middleware `authenticate` a partir do JWT) — nunca um
    // valor vindo do corpo da requisição, que não é mais aceito pelo schema.
    const avaliacao = { ...req.body, id_usuario_fk: req.usuario!.id };
    res.status(201).json(await Avaliacao.create(avaliacao));
  } catch (error) {
    // Preserva o 409 do Model quando o usuário já avaliou o jogo, em vez de
    // mascarar tudo como 400 genérico.
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao criar avaliação', 500);
  }
}

async function update(req: Request<{ id: string }, unknown, AvaliacaoInput>, res: Response<unknown>) {
  try {
    const avaliacao = req.body;
    const { id } = req.params;

    res.json(await Avaliacao.update({ ...avaliacao, id: Number(id) }));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao atualizar avaliação', 500);
  }
}

async function remove(req: Request<{ id: string }, unknown>, res: Response<unknown>) {
  try {
    if (await Avaliacao.remove(Number(req.params.id))) return res.sendStatus(204);
    throw new HttpError('Avaliação não encontrada', 404);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao remover avaliação', 500);
  }
}

export default { getDestaque, read, readById, create, update, remove };
