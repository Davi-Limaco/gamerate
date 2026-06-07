import type { Request, Response } from 'express';

import Usuario from '@/models/usuario.model.js';
import HttpError from '@/errors/HttpError.js';
import type { LoginInput, UsuarioInput } from '@/types/Usuario.d.ts';

async function read(req: Request, res: Response) {
  try {
    res.json(await Usuario.readAll());
  } catch (error) {
    throw new HttpError('Erro ao listar usuários', 500);
  }
}

async function readById(req: Request<{ id: string }>, res: Response) {
  try {
    res.json(await Usuario.readById(Number(req.params.id)));
  } catch (error) {
    throw new HttpError('Usuário não encontrado', 404);
  }
}

async function readAvaliacoes(req: Request<{ id: string }>, res: Response) {
  try {
    res.json(await Usuario.readAvaliacoes(Number(req.params.id)));
  } catch (error) {
    throw new HttpError('Erro ao buscar avaliações do usuário', 500);
  }
}

async function create(req: Request, res: Response) {
  try {
    const usuario = req.body as UsuarioInput;
    res.status(201).json(await Usuario.create(usuario));
  } catch (error) {
    throw new HttpError('Erro ao criar usuário', 400);
  }
}

async function update(req: Request<{ id: string }>, res: Response) {
  try {
    const usuario = req.body as UsuarioInput;
    const { id } = req.params;

    res.json(await Usuario.update({ ...usuario, id: Number(id) }));
  } catch (error) {
    throw new HttpError('Erro ao atualizar usuário', 400);
  }
}

async function updatePerfil(req: Request<{ id: string }>, res: Response) {
  try {
    const { id_perfil_fk } = req.body as { id_perfil_fk?: number };
    const { id } = req.params;

    res.json(await Usuario.updatePerfil({ id: Number(id), id_perfil_fk }));
  } catch (error) {
    throw new HttpError('Erro ao atualizar perfil', 400);
  }
}

async function remove(req: Request<{ id: string }>, res: Response) {
  try {
    if (await Usuario.remove(Number(req.params.id))) return res.sendStatus(204);
    throw new HttpError('Usuário não encontrado', 404);
  } catch (error) {
    throw new HttpError('Erro ao remover usuário', 400);
  }
}

async function login(req: Request, res: Response) {
  try {
    const { email, senha } = req.body as LoginInput;
    const usuario = await Usuario.readByEmail(email);

    if (!usuario || usuario.senha !== senha) {
      throw new HttpError('Credenciais inválidas', 401);
    }

    res.json({ id: usuario.id_usuario, nome: usuario.nome_usuario, perfil: usuario.nome_perfil });
  } catch (error) {
    throw new HttpError('Credenciais inválidas', 401);
  }
}

async function cadastro(req: Request, res: Response) {
  try {
    const usuario = req.body as UsuarioInput;
    const created = await Usuario.create(usuario);
    res.status(201).json({ id: created.id_usuario, nome: created.nome_usuario, perfil: created.nome_perfil });
  } catch (error) {
    throw new HttpError('Erro ao cadastrar usuário', 400);
  }
}

export default { read, readById, readAvaliacoes, create, update, updatePerfil, remove, login, cadastro };
