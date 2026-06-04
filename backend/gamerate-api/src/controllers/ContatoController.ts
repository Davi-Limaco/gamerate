/**
 * controllers/ContatoController.ts — Controller para gerenciar Contatos
 */

import { Request, Response, NextFunction } from 'express';
import Contato from '../models/Contato.js';

async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const contatos = await Contato.readAll();
    res.json(contatos);
  } catch (err) {
    next(err);
  }
}

async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const contato = await Contato.create(req.body);
    res.status(201).json(contato);
  } catch (err) {
    next(err);
  }
}

async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await Contato.remove(Number(req.params.id));
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

export default { getAll, create, remove };
