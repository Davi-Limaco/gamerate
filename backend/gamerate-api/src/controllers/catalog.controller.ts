import type { Request, Response } from 'express';

import Genero from '@/models/genero.model.ts';
import Plataforma from '@/models/plataforma.model.ts';
import Perfil from '@/models/perfil.model.ts';
import HttpError from '@/errors/HttpError.ts';
import type { GeneroInput } from '@/types/Genero.d.ts';
import type { PlataformaInput } from '@/types/Plataforma.d.ts';
import type { PerfilInput } from '@/types/Perfil.d.ts';

async function readGeneros(_req: Request, res: Response<unknown>) {
  try { res.json(await Genero.readAll()); }
  catch (error) { throw new HttpError('Erro ao listar gêneros', 500); }
}

async function createGenero(req: Request<Record<string, string>, unknown, GeneroInput>, res: Response<unknown>) {
  try {
    const genero = req.body;
    res.status(201).json(await Genero.create(genero));
  }
  catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao criar gênero', 500);
  }
}

async function removeGenero(req: Request<{ id: string }, unknown>, res: Response<unknown>) {
  try { if (await Genero.remove(Number(req.params.id))) return res.sendStatus(204); }
  catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Gênero não encontrado', 404);
  }
}

async function readPlataformas(_req: Request, res: Response<unknown>) {
  try { res.json(await Plataforma.readAll()); }
  catch (error) { throw new HttpError('Erro ao listar plataformas', 500); }
}

async function createPlataforma(req: Request<Record<string, string>, unknown, PlataformaInput>, res: Response<unknown>) {
  try {
    const plataforma = req.body;
    res.status(201).json(await Plataforma.create(plataforma));
  }
  catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao criar plataforma', 500);
  }
}

async function removePlataforma(req: Request<{ id: string }, unknown>, res: Response<unknown>) {
  try { if (await Plataforma.remove(Number(req.params.id))) return res.sendStatus(204); }
  catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Plataforma não encontrada', 404);
  }
}

async function readPerfis(_req: Request, res: Response<unknown>) {
  try { res.json(await Perfil.readAll()); }
  catch (error) { throw new HttpError('Erro ao listar perfis', 500); }
}

async function createPerfil(req: Request<Record<string, string>, unknown, PerfilInput>, res: Response<unknown>) {
  try {
    const perfil = req.body;
    res.status(201).json(await Perfil.create(perfil));
  }
  catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao criar perfil', 500);
  }
}

async function updatePerfil(req: Request<{ id: string }, unknown, PerfilInput>, res: Response<unknown>) {
  try {
    const perfil = req.body;
    const { id } = req.params;

    res.json(await Perfil.update({ ...perfil, id: Number(id) }));
  }
  catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao atualizar perfil', 500);
  }
}

async function removePerfil(req: Request<{ id: string }, unknown>, res: Response<unknown>) {
  try { if (await Perfil.remove(Number(req.params.id))) return res.sendStatus(204); }
  catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Perfil não encontrado', 404);
  }
}

export default {
  readGeneros, createGenero, removeGenero,
  readPlataformas, createPlataforma, removePlataforma,
  readPerfis, createPerfil, updatePerfil, removePerfil,
};
