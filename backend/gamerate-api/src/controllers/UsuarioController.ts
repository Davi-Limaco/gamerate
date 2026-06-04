/**
 * controllers/UsuarioController.ts — Controller para gerenciar Usuários
 */

import { Request, Response, NextFunction } from 'express';
import Usuario from '../models/Usuario.js';
import { unauthorized } from '../errors/HttpError.js';

async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const usuarios = await Usuario.readAll();
    res.json(usuarios);
  } catch (err) {
    next(err);
  }
}

async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const usuario = await Usuario.readById(Number(req.params.id));
    res.json(usuario);
  } catch (err) {
    next(err);
  }
}

async function getAvaliacoes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const avaliacoes = await Usuario.readAvaliacoes(Number(req.params.id));
    res.json(avaliacoes);
  } catch (err) {
    next(err);
  }
}

async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const usuario = await Usuario.create(req.body);
    res.status(201).json(usuario);
  } catch (err) {
    next(err);
  }
}

async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const usuario = await Usuario.update({ id: Number(req.params.id), ...req.body });
    res.json(usuario);
  } catch (err) {
    next(err);
  }
}

async function updatePerfil(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const usuario = await Usuario.updatePerfil({ id: Number(req.params.id), ...req.body });
    res.json(usuario);
  } catch (err) {
    next(err);
  }
}

async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await Usuario.remove(Number(req.params.id));
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, senha } = req.body;
    const usuario = await Usuario.readByEmail(email);

    if (!usuario || usuario.senha !== senha) {
      throw unauthorized('Credenciais inválidas');
    }

    res.json({
      id: usuario.id_usuario,
      nome: usuario.nome_usuario,
      perfil: usuario.nome_perfil,
    });
  } catch (err) {
    next(err);
  }
}

async function cadastro(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const usuario = await Usuario.create(req.body);

    res.status(201).json({
      id: usuario.id_usuario,
      nome: usuario.nome_usuario,
      perfil: usuario.nome_perfil,
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getAll,
  getById,
  getAvaliacoes,
  create,
  update,
  updatePerfil,
  remove,
  login,
  cadastro,
};
