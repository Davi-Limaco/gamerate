/**
 * models/Avaliacao.ts — Model para a entidade Avaliacao
 */

import Database from '../database/database.js';
import type { Avaliacao } from '../types/index.js';
import { badRequest, notFound, conflict } from '../errors/HttpError.js';
import Jogo from './Jogo.js';

interface AvaliacaoCreateInput {
  id_usuario_fk: number;
  id_jogo_fk: number;
  nota: number;
  titulo: string;
  texto: string;
}

interface AvaliacaoUpdateInput {
  id: number;
  nota: number;
  titulo: string;
  texto: string;
}

interface AvaliacaoFilter {
  jogo_id?: number;
}

async function readAll(filter?: AvaliacaoFilter): Promise<Avaliacao[]> {
  const db = await Database.connect();

  const where = filter?.jogo_id ? 'WHERE a.id_jogo_fk = ?' : '';
  const params = filter?.jogo_id ? [filter.jogo_id] : [];

  const sql = `
    SELECT a.id_avaliacao, a.titulo, a.texto, a.nota, a.data_publicacao,
           u.id_usuario, u.nome_usuario,
           j.id_jogo, j.nome_jogo, j.capa
    FROM avaliacao a
    JOIN usuario u ON u.id_usuario = a.id_usuario_fk
    JOIN jogo    j ON j.id_jogo    = a.id_jogo_fk
    ${where}
    ORDER BY a.data_publicacao DESC
  `;

  return await db.all<Avaliacao>(sql, params);
}

async function readById(id: number): Promise<Avaliacao> {
  const db = await Database.connect();

  const avaliacao = await db.get<Avaliacao>(
    `
    SELECT a.*,
           u.nome_usuario, j.nome_jogo, j.capa, j.id_jogo
    FROM avaliacao a
    JOIN usuario u ON u.id_usuario = a.id_usuario_fk
    JOIN jogo    j ON j.id_jogo    = a.id_jogo_fk
    WHERE a.id_avaliacao = ?
  `,
    [id]
  );

  if (!avaliacao) throw notFound('Avaliação não encontrada');

  return avaliacao;
}

async function create(input: AvaliacaoCreateInput): Promise<Avaliacao> {
  const db = await Database.connect();
  const { id_usuario_fk, id_jogo_fk, nota, titulo, texto } = input;

  if (!id_usuario_fk || !id_jogo_fk || nota === undefined || nota === null || !titulo || !texto) {
    throw badRequest('Campos obrigatórios: id_usuario_fk, id_jogo_fk, nota, titulo, texto');
  }

  const notaNum = parseFloat(String(nota));
  if (isNaN(notaNum) || notaNum < 1 || notaNum > 5) {
    throw badRequest('A nota deve ser um número entre 1 e 5');
  }

  const jaAvaliou = await db.get(
    `SELECT 1 FROM avaliacao WHERE id_usuario_fk = ? AND id_jogo_fk = ?`,
    [id_usuario_fk, id_jogo_fk]
  );

  if (jaAvaliou) {
    throw conflict('Você já avaliou este jogo. Edite ou exclua sua avaliação existente.');
  }

  const { lastID } = await db.run(
    `INSERT INTO avaliacao (id_usuario_fk, id_jogo_fk, nota, titulo, texto)
     VALUES (?, ?, ?, ?, ?)`,
    [id_usuario_fk, id_jogo_fk, notaNum, titulo, texto]
  );

  await Jogo.atualizarNota(id_jogo_fk);

  return await readById(lastID);
}

async function update(input: AvaliacaoUpdateInput): Promise<Avaliacao> {
  const db = await Database.connect();
  const { id, nota, titulo, texto } = input;

  if (!id || nota === undefined || nota === null || !titulo || !texto) {
    throw badRequest('Campos obrigatórios: nota, titulo, texto');
  }

  const notaNum = parseFloat(String(nota));
  if (isNaN(notaNum) || notaNum < 1 || notaNum > 5) {
    throw badRequest('A nota deve ser um número entre 1 e 5');
  }

  const { changes } = await db.run(
    `UPDATE avaliacao SET nota = ?, titulo = ?, texto = ? WHERE id_avaliacao = ?`,
    [notaNum, titulo, texto, id]
  );

  if (changes === 1) {
    const av = await readById(id);
    await Jogo.atualizarNota(av.id_jogo_fk);
    return av;
  }

  throw notFound('Avaliação não encontrada');
}

async function remove(id: number): Promise<boolean> {
  const db = await Database.connect();

  const av = await readById(id);

  const { changes } = await db.run(`DELETE FROM avaliacao WHERE id_avaliacao = ?`, [id]);

  if (changes === 1) {
    await Jogo.atualizarNota(av.id_jogo_fk);
    return true;
  }

  throw notFound('Avaliação não encontrada');
}

async function getDestaque(): Promise<Avaliacao[]> {
  const db = await Database.connect();

  return await db.all<Avaliacao>(
    `
    SELECT a.id_avaliacao, a.titulo, a.texto, a.nota, a.data_publicacao,
           u.id_usuario, u.nome_usuario,
           j.id_jogo, j.nome_jogo, j.capa
    FROM avaliacao a
    JOIN usuario u ON u.id_usuario = a.id_usuario_fk
    JOIN jogo    j ON j.id_jogo    = a.id_jogo_fk
    ORDER BY a.nota DESC, a.data_publicacao DESC
    LIMIT 6
  `
  );
}

export default {
  readAll,
  readById,
  create,
  update,
  remove,
  getDestaque,
};
