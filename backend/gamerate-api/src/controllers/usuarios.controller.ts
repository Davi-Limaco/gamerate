import type { Request, Response } from 'express';

import Usuario from '@/models/usuario.model.ts';
import HttpError from '@/errors/HttpError.ts';
import type { LoginInput, UsuarioInput } from '@/types/Usuario.d.ts';
import { signJwt } from '@/utils/jwt.ts';
import { verifyPassword } from '@/utils/password.ts';

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
    res.status(201).json(await Usuario.create({ ...usuario, id_perfil_fk: 1 }));
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
    if (!email?.trim() || !senha) {
      throw new HttpError('E-mail e senha são obrigatórios', 400);
    }

    const usuario = await Usuario.readByEmailWithPassword(email.trim().toLowerCase());

    if (!usuario || !verifyPassword(senha, usuario.senha || '')) {
      throw new HttpError('Credenciais inválidas', 401);
    }

    const token = signJwt({
      userId: usuario.id_usuario,
      nome: usuario.nome_usuario,
      email: usuario.email,
    });

    res.json({ auth: true, token });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Credenciais inválidas', 401);
  }
}

async function cadastro(req: Request, res: Response) {
  try {
    const usuario = req.body as UsuarioInput;
    const created = await Usuario.create({ ...usuario, id_perfil_fk: 1 });

    res.status(201).json(created);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Erro ao cadastrar usuário', 400);
  }
}

async function me(req: Request, res: Response) {
  try {
    if (!req.userId) {
      throw new HttpError('Unauthorized', 401);
    }

    const usuario = await Usuario.readById(req.userId);
    res.json(usuario);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('Usuário não encontrado', 404);
  }
}

export default { read, readById, readAvaliacoes, create, update, updatePerfil, remove, login, cadastro, me };
