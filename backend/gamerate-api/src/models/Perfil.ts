/**
 * models/Perfil.ts — Model para a entidade Perfil
 */

import Database from '../database/database.js';
import type { Perfil } from '../types/index.js';
import { notFound } from '../errors/HttpError.js';

async function readAll(): Promise<Perfil[]> {
  const db = await Database.connect();
  const sql = `SELECT id_perfil, nome_perfil FROM perfil ORDER BY id_perfil`;
  return await db.all(sql);
}

async function readById(id: number): Promise<Perfil> {
  const db = await Database.connect();
  const sql = `SELECT id_perfil, nome_perfil FROM perfil WHERE id_perfil = ?`;
  const perfil = await db.get<Perfil>(sql, [id]);

  if (!perfil) throw notFound('Perfil não encontrado');
  return perfil;
}

async function create({ nome_perfil }: { nome_perfil: string }): Promise<Perfil> {
  const db = await Database.connect();

  if (!nome_perfil) throw new Error('O campo nome_perfil é obrigatório');

  const sql = `INSERT INTO perfil (nome_perfil) VALUES (?)`;
  const { lastID } = await db.run(sql, [nome_perfil]);

  return await readById(lastID);
}

async function update({ id, nome_perfil }: { id: number; nome_perfil: string }): Promise<Perfil> {
  const db = await Database.connect();

  if (!id || !nome_perfil) throw new Error('Os campos id e nome_perfil são obrigatórios');

  const sql = `UPDATE perfil SET nome_perfil = ? WHERE id_perfil = ?`;
  const { changes } = await db.run(sql, [nome_perfil, id]);

  if (changes === 1) return await readById(id);
  throw notFound('Perfil não encontrado');
}

async function remove(id: number): Promise<boolean> {
  const db = await Database.connect();
  const sql = `DELETE FROM perfil WHERE id_perfil = ?`;
  const { changes } = await db.run(sql, [id]);

  if (changes === 1) return true;
  throw notFound('Perfil não encontrado');
}

export default { readAll, readById, create, update, remove };
