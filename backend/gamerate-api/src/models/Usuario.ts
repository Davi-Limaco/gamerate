/**
 * models/Usuario.ts — Model para a entidade Usuario
 */

import Database from '../database/database.js';
import type { Usuario, Avaliacao } from '../types/index.js';
import { badRequest, notFound } from '../errors/HttpError.js';

interface UsuarioCreateInput {
  nome_usuario: string;
  email: string;
  senha: string;
  id_perfil_fk?: number;
}

interface UsuarioUpdateInput {
  id: number;
  nome_usuario?: string;
  email?: string;
  senha?: string;
}

interface UsuarioUpdatePerfilInput {
  id: number;
  id_perfil_fk: number;
}

async function readAll(): Promise<Usuario[]> {
  const db = await Database.connect();

  const sql = `
    SELECT u.id_usuario, u.nome_usuario, u.email, u.data_criacao,
           p.nome_perfil
    FROM usuario u
    JOIN perfil p ON p.id_perfil = u.id_perfil_fk
    ORDER BY u.id_usuario
  `;

  return await db.all<Usuario>(sql);
}

async function readById(id: number): Promise<Usuario> {
  const db = await Database.connect();

  const sql = `
    SELECT u.id_usuario, u.nome_usuario, u.email, u.data_criacao,
           p.nome_perfil,
           (SELECT COUNT(*) FROM avaliacao a WHERE a.id_usuario_fk = u.id_usuario) AS total_avaliacoes
    FROM usuario u
    JOIN perfil p ON p.id_perfil = u.id_perfil_fk
    WHERE u.id_usuario = ?
  `;

  const usuario = await db.get<Usuario>(sql, [id]);

  if (usuario) return usuario;
  throw notFound('Usuário não encontrado');
}

async function readByEmail(email: string): Promise<Usuario | undefined> {
  const db = await Database.connect();

  const sql = `
    SELECT u.id_usuario, u.nome_usuario, u.email, u.senha,
           p.nome_perfil
    FROM usuario u
    JOIN perfil p ON p.id_perfil = u.id_perfil_fk
    WHERE u.email = ?
  `;

  return await db.get<Usuario>(sql, [email]);
}

async function create(input: UsuarioCreateInput): Promise<Usuario> {
  const db = await Database.connect();
  const { nome_usuario, email, senha, id_perfil_fk = 1 } = input;

  if (!nome_usuario || !email || !senha) {
    throw badRequest('Campos obrigatórios: nome_usuario, email, senha');
  }

  const sql = `
    INSERT INTO usuario (nome_usuario, email, senha, id_perfil_fk)
    VALUES (?, ?, ?, ?)
  `;

  const { lastID } = await db.run(sql, [nome_usuario, email, senha, id_perfil_fk]);

  return await readById(lastID);
}

async function update(input: UsuarioUpdateInput): Promise<Usuario> {
  const db = await Database.connect();
  const { id, nome_usuario, email, senha } = input;

  const fields: string[] = [];
  const params: any[] = [];

  if (nome_usuario) {
    fields.push('nome_usuario = ?');
    params.push(nome_usuario);
  }
  if (email) {
    fields.push('email = ?');
    params.push(email);
  }
  if (senha) {
    fields.push('senha = ?');
    params.push(senha);
  }

  if (fields.length === 0) throw badRequest('Nenhum campo para atualizar');

  params.push(id);

  const sql = `UPDATE usuario SET ${fields.join(', ')} WHERE id_usuario = ?`;

  const { changes } = await db.run(sql, params);

  if (changes === 1) return readById(id);

  throw notFound('Usuário não encontrado');
}

async function updatePerfil(input: UsuarioUpdatePerfilInput): Promise<Usuario> {
  const db = await Database.connect();
  const { id, id_perfil_fk } = input;

  const sql = `UPDATE usuario SET id_perfil_fk = ? WHERE id_usuario = ?`;

  const { changes } = await db.run(sql, [id_perfil_fk, id]);

  if (changes === 1) return readById(id);

  throw notFound('Usuário não encontrado');
}

async function remove(id: number): Promise<boolean> {
  const db = await Database.connect();

  const { changes } = await db.run(`DELETE FROM usuario WHERE id_usuario = ?`, [id]);

  if (changes === 1) return true;

  throw notFound('Usuário não encontrado');
}

async function readAvaliacoes(id: number): Promise<Avaliacao[]> {
  const db = await Database.connect();

  const sql = `
    SELECT a.id_avaliacao, a.titulo, a.nota, a.data_publicacao,
           j.id_jogo, j.nome_jogo, j.capa
    FROM avaliacao a
    JOIN jogo j ON j.id_jogo = a.id_jogo_fk
    WHERE a.id_usuario_fk = ?
    ORDER BY a.data_publicacao DESC
  `;

  return await db.all<Avaliacao>(sql, [id]);
}

export default {
  readAll,
  readById,
  readByEmail,
  create,
  update,
  updatePerfil,
  remove,
  readAvaliacoes,
};
