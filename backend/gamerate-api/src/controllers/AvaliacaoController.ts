/**
 * controllers/AvaliacaoController.ts — Controller para gerenciar Avaliações
 */

import { Request, Response, NextFunction } from 'express';
import Avaliacao from '../models/Avaliacao.js';

async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await Avaliacao.readAll(req.query as any);
    res.json({ total: result.length, avaliacoes: result });
  } catch (err) {
    next(err);
  }
}

async function getDestaque(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const avaliacoes = await Avaliacao.getDestaque();
    res.json(avaliacoes);
  } catch (err) {
    next(err);
  }
}

async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const avaliacao = await Avaliacao.readById(Number(req.params.id));
    res.json(avaliacao);
  } catch (err) {
    next(err);
  }
}

async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const avaliacao = await Avaliacao.create(req.body);
    res.status(201).json(avaliacao);
  } catch (err) {
    next(err);
  }
}

async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const avaliacao = await Avaliacao.update({ id: Number(req.params.id), ...req.body });
    res.json(avaliacao);
  } catch (err) {
    next(err);
  }
}

async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await Avaliacao.remove(Number(req.params.id));
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

export default {
  getDestaque,
  getAll,
  getById,
  create,
  update,
  remove,
};
