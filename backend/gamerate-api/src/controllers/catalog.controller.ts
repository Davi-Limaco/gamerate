import type { Request, Response } from 'express';

import { Genero, Plataforma } from '@/models/categoria.model.ts';
import Perfil from '@/models/perfil.model.ts';
import HttpError from '@/errors/HttpError.ts';
import type { GeneroInput, PlataformaInput } from '@/types/Jogo.d.ts';
import type { PerfilInput } from '@/types/Perfil.d.ts';

async function readGeneros(_req: Request, res: Response) {
  try { res.json(await Genero.readAll()); }
  catch (error) { throw new HttpError('Erro ao listar gêneros', 500); }
}

async function createGenero(req: Request, res: Response) {
  try {
    const genero = req.body as GeneroInput;
    res.status(201).json(await Genero.create(genero));
  }
  catch (error) { throw new HttpError('Erro ao criar gênero', 400); }
}

async function removeGenero(req: Request<{ id: string }>, res: Response) {
  try { if (await Genero.remove(Number(req.params.id))) return res.sendStatus(204); }
  catch (error) { throw new HttpError('Gênero não encontrado', 404); }
}

async function readPlataformas(_req: Request, res: Response) {
  try { res.json(await Plataforma.readAll()); }
  catch (error) { throw new HttpError('Erro ao listar plataformas', 500); }
}

async function createPlataforma(req: Request, res: Response) {
  try {
    const plataforma = req.body as PlataformaInput;
    res.status(201).json(await Plataforma.create(plataforma));
  }
  catch (error) { throw new HttpError('Erro ao criar plataforma', 400); }
}

async function removePlataforma(req: Request<{ id: string }>, res: Response) {
  try { if (await Plataforma.remove(Number(req.params.id))) return res.sendStatus(204); }
  catch (error) { throw new HttpError('Plataforma não encontrada', 404); }
}

async function readPerfis(_req: Request, res: Response) {
  try { res.json(await Perfil.readAll()); }
  catch (error) { throw new HttpError('Erro ao listar perfis', 500); }
}

async function createPerfil(req: Request, res: Response) {
  try {
    const perfil = req.body as PerfilInput;
    res.status(201).json(await Perfil.create(perfil));
  }
  catch (error) { throw new HttpError('Erro ao criar perfil', 400); }
}

async function updatePerfil(req: Request<{ id: string }>, res: Response) {
  try {
    const perfil = req.body as PerfilInput;
    const { id } = req.params;

    res.json(await Perfil.update({ ...perfil, id: Number(id) }));
  }
  catch (error) { throw new HttpError('Erro ao atualizar perfil', 400); }
}

async function removePerfil(req: Request<{ id: string }>, res: Response) {
  try { if (await Perfil.remove(Number(req.params.id))) return res.sendStatus(204); }
  catch (error) { throw new HttpError('Perfil não encontrado', 404); }
}

export default {
  readGeneros, createGenero, removeGenero,
  readPlataformas, createPlataforma, removePlataforma,
  readPerfis, createPerfil, updatePerfil, removePerfil,
};
