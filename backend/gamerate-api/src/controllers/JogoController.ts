/**
 * controllers/JogoController.ts — Controller para gerenciar Jogos
 */

import { Request, Response, NextFunction } from 'express';
import Jogo from '../models/Jogo.js';

async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await Jogo.getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

async function getDestaques(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const destaques = await Jogo.getDestaques();
    res.json(destaques);
  } catch (err) {
    next(err);
  }
}

async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const jogos = await Jogo.readAll(req.query as any);
    res.json({ total: jogos.length, jogos });
  } catch (err) {
    next(err);
  }
}

async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const jogo = await Jogo.readById(Number(req.params.id));
    res.json(jogo);
  } catch (err) {
    next(err);
  }
}

async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const jogo = await Jogo.create(req.body);
    res.status(201).json(jogo);
  } catch (err) {
    next(err);
  }
}

async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const jogo = await Jogo.update({ id: Number(req.params.id), ...req.body });
    res.json(jogo);
  } catch (err) {
    next(err);
  }
}

async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await Jogo.remove(Number(req.params.id));
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

export default {
  getStats,
  getDestaques,
  getAll,
  getById,
  create,
  update,
  remove,
};
