import type { Request, Response } from 'express';

import Usuario from '@/models/usuario.model.ts';
import HttpError from '@/errors/HttpError.ts';
import type { UsuarioInput } from '@/types/Usuario.d.ts';

// Cadastro (signup) e login foram movidos para auth.controller.ts — este
// arquivo cuida apenas do CRUD de usuários (rotas protegidas por
// autenticação/dono do recurso, ver usuarios.routes.ts).

async function read(_req: Request, res: Response<unknown>) {
  try {
    res.json(await Usuario.readAll());
  } catch (error) {
    throw new HttpError('Erro ao listar usuários', 500);
  }
}

async function readById(req: Request<{ id: string }, unknown>, res: Response<unknown>) {
  try {
    res.json(await Usuario.readById(Number(req.params.id)));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao buscar usuário', 500);
  }
}

async function readAvaliacoes(req: Request<{ id: string }, unknown>, res: Response<unknown>) {
  try {
    res.json(await Usuario.readAvaliacoes(Number(req.params.id)));
  } catch (error) {
    throw new HttpError('Erro ao buscar avaliações do usuário', 500);
  }
}

async function create(req: Request<Record<string, string>, unknown, UsuarioInput>, res: Response<unknown>) {
  try {
    const usuario = req.body;
    res.status(201).json(await Usuario.create(usuario));
  } catch (error) {
    // Preserva o status/mensagem definidos pelo Model (ex.: 409 de e-mail
    // duplicado) em vez de mascarar tudo como 400 genérico.
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao criar usuário', 500);
  }
}

async function update(req: Request<{ id: string }, unknown, UsuarioInput>, res: Response<unknown>) {
  try {
    const usuario = req.body;
    const { id } = req.params;

    res.json(await Usuario.update({ ...usuario, id: Number(id) }));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao atualizar usuário', 500);
  }
}

async function updatePerfil(req: Request<{ id: string }, unknown, { id_perfil_fk?: number }>, res: Response<unknown>) {
  try {
    const { id_perfil_fk } = req.body;
    const { id } = req.params;

    res.json(await Usuario.updatePerfil({ id: Number(id), id_perfil_fk }));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao atualizar perfil', 500);
  }
}

async function remove(req: Request<{ id: string }, unknown>, res: Response<unknown>) {
  try {
    if (await Usuario.remove(Number(req.params.id))) return res.sendStatus(204);
    throw new HttpError('Usuário não encontrado', 404);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao remover usuário', 500);
  }
}

export default { read, readById, readAvaliacoes, create, update, updatePerfil, remove };
