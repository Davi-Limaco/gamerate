import Database from '@/database/database.js';
import type { Contato, ContatoInput } from '@/types/Contato.d.ts';
import HttpError from '@/errors/HttpError.js';

function mapContato(row: Record<string, unknown>): Contato {
  return {
    id_comunicacao: row.id_comunicacao as number,
    email_contato: row.email_contato as string,
    tipo: row.tipo as string,
    mensagem: row.mensagem as string,
    data_comunicacao: row.data_comunicacao as string,
  };
}

async function readAll(): Promise<Contato[]> {
  const db = await Database.connect();
  const rows = await db.all(`SELECT * FROM comunicacao_site ORDER BY data_comunicacao DESC`);
  return rows.map(mapContato);
}

async function readById(id: number): Promise<Contato> {
  const db = await Database.connect();
  const contato = await db.get(`SELECT * FROM comunicacao_site WHERE id_comunicacao = ?`, [id]);

  if (contato) return mapContato(contato);
  throw new HttpError('Contato não encontrado', 404);
}

async function create({ email_contato, tipo, mensagem }: ContatoInput): Promise<Contato> {
  const db = await Database.connect();

  if (!email_contato || !tipo || !mensagem) {
    throw new HttpError('Campos obrigatórios: email_contato, tipo, mensagem');
  }

  const { lastID } = await db.run(
    `INSERT INTO comunicacao_site (email_contato, tipo, mensagem) VALUES (?, ?, ?)`,
    [email_contato, tipo, mensagem],
  );

  return await readById(lastID);
}

async function remove(id: number): Promise<boolean> {
  const db = await Database.connect();
  const { changes } = await db.run(`DELETE FROM comunicacao_site WHERE id_comunicacao = ?`, [id]);

  if (changes === 1) return true;
  throw new HttpError('Contato não encontrado', 404);
}

export default { readAll, readById, create, remove };
