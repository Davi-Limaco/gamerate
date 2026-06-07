import Database from '@/database/database.js';
import type { Perfil, PerfilInput } from '@/types/Perfil.d.ts';
import HttpError from '@/errors/HttpError.js';

function mapPerfil(row: Record<string, unknown>): Perfil {
  return {
    id_perfil: row.id_perfil as number,
    nome_perfil: row.nome_perfil as string,
  };
}

async function readAll(): Promise<Perfil[]> {
  const db = await Database.connect();
  const rows = await db.all(`SELECT id_perfil, nome_perfil FROM perfil ORDER BY id_perfil`);
  return rows.map(mapPerfil);
}

async function readById(id: number): Promise<Perfil> {
  const db = await Database.connect();
  const perfil = await db.get(`SELECT id_perfil, nome_perfil FROM perfil WHERE id_perfil = ?`, [id]);

  if (perfil) return mapPerfil(perfil);
  throw new HttpError('Perfil não encontrado', 404);
}

async function create({ nome_perfil }: PerfilInput): Promise<Perfil> {
  const db = await Database.connect();

  if (!nome_perfil) throw new HttpError('O campo nome_perfil é obrigatório');

  const { lastID } = await db.run(`INSERT INTO perfil (nome_perfil) VALUES (?)`, [nome_perfil]);
  return await readById(lastID);
}

async function update({ id, nome_perfil }: PerfilInput & { id?: number }): Promise<Perfil> {
  const db = await Database.connect();

  if (!id || !nome_perfil) throw new HttpError('Os campos id e nome_perfil são obrigatórios');

  const { changes } = await db.run(`UPDATE perfil SET nome_perfil = ? WHERE id_perfil = ?`, [nome_perfil, id]);

  if (changes === 1) return await readById(id);
  throw new HttpError('Perfil não encontrado', 404);
}

async function remove(id: number): Promise<boolean> {
  const db = await Database.connect();
  const { changes } = await db.run(`DELETE FROM perfil WHERE id_perfil = ?`, [id]);

  if (changes === 1) return true;
  throw new HttpError('Perfil não encontrado', 404);
}

export default { readAll, readById, create, update, remove };
