/**
 * models/Contato.ts — Model para a entidade Contato
 */

import Database from '../database/database.js';
import type { Contato } from '../types/index.js';
import { badRequest, notFound } from '../errors/HttpError.js';

interface ContatoCreateInput {
  email_contato: string;
  tipo: string;
  mensagem: string;
}

async function readAll(): Promise<Contato[]> {
  const db = await Database.connect();

  return await db.all<Contato>(`SELECT * FROM comunicacao_site ORDER BY data_comunicacao DESC`);
}

async function readById(id: number): Promise<Contato> {
  const db = await Database.connect();

  const contato = await db.get<Contato>(
    `SELECT * FROM comunicacao_site WHERE id_comunicacao = ?`,
    [id]
  );

  if (contato) return contato;

  throw notFound('Contato não encontrado');
}

async function create(input: ContatoCreateInput): Promise<Contato> {
  const db = await Database.connect();
  const { email_contato, tipo, mensagem } = input;

  if (!email_contato || !tipo || !mensagem) {
    throw badRequest('Campos obrigatórios: email_contato, tipo, mensagem');
  }

  const sql = `
    INSERT INTO comunicacao_site (email_contato, tipo, mensagem)
    VALUES (?, ?, ?)
  `;

  const { lastID } = await db.run(sql, [email_contato, tipo, mensagem]);

  return await readById(lastID);
}

async function remove(id: number): Promise<boolean> {
  const db = await Database.connect();

  const { changes } = await db.run(`DELETE FROM comunicacao_site WHERE id_comunicacao = ?`, [id]);

  if (changes === 1) return true;

  throw notFound('Contato não encontrado');
}

export default { readAll, readById, create, remove };
