/**
 * controllers/CatalogController.ts — Controller para gerenciar Categorias (Gêneros, Plataformas, Perfis)
 */

import { Request, Response, NextFunction } from 'express';
import { Genero, Plataforma } from '../models/Categoria.js';
import Perfil from '../models/Perfil.js';

// ── GÊNEROS ───────────────────────────────────────────────────

async function getAllGeneros(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const generos = await Genero.readAll();
    res.json(generos);
  } catch (err) {
    next(err);
  }
}

async function createGenero(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const genero = await Genero.create(req.body);
    res.status(201).json(genero);
  } catch (err) {
    next(err);
  }
}

async function removeGenero(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await Genero.remove(Number(req.params.id));
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

// ── PLATAFORMAS ───────────────────────────────────────────────

async function getAllPlataformas(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const plataformas = await Plataforma.readAll();
    res.json(plataformas);
  } catch (err) {
    next(err);
  }
}

async function createPlataforma(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const plataforma = await Plataforma.create(req.body);
    res.status(201).json(plataforma);
  } catch (err) {
    next(err);
  }
}

async function removePlataforma(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await Plataforma.remove(Number(req.params.id));
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

// ── PERFIS ────────────────────────────────────────────────────

async function getAllPerfis(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const perfis = await Perfil.readAll();
    res.json(perfis);
  } catch (err) {
    next(err);
  }
}

async function createPerfil(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const perfil = await Perfil.create(req.body);
    res.status(201).json(perfil);
  } catch (err) {
    next(err);
  }
}

async function updatePerfil(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const perfil = await Perfil.update({ id: Number(req.params.id), ...req.body });
    res.json(perfil);
  } catch (err) {
    next(err);
  }
}

async function removePerfil(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await Perfil.remove(Number(req.params.id));
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

export default {
  getAllGeneros,
  createGenero,
  removeGenero,
  getAllPlataformas,
  createPlataforma,
  removePlataforma,
  getAllPerfis,
  createPerfil,
  updatePerfil,
  removePerfil,
};
