import Database from '@/database/database.ts';
import type { Avaliacao, AvaliacaoInput, AvaliacaoFilter } from '@/types/Avaliacao.d.ts';
import HttpError from '@/errors/HttpError.ts';
import Jogo from '@/models/jogo.model.ts';

function mapAvaliacao(row: Record<string, unknown>): Avaliacao {
  return {
    id_avaliacao: row.id_avaliacao as number,
    id_usuario_fk: row.id_usuario_fk as number,
    id_jogo_fk: row.id_jogo_fk as number,
    nota: row.nota as number,
    titulo: row.titulo as string,
    texto: row.texto as string,
    data_publicacao: row.data_publicacao as string,
    nome_usuario: row.nome_usuario as string | undefined,
    nome_jogo: row.nome_jogo as string | undefined,
    capa: row.capa as string | null | undefined,
    id_usuario: row.id_usuario as number | undefined,
    id_jogo: row.id_jogo as number | undefined,
  };
}

async function readAll(filter?: AvaliacaoFilter): Promise<Avaliacao[]> {
  const db = await Database.connect();

  const where  = filter?.jogo_id ? 'WHERE a.id_jogo_fk = ?' : '';
  const params = filter?.jogo_id ? [filter.jogo_id] : [];

  const rows = await db.all(
    `SELECT a.id_avaliacao, a.titulo, a.texto, a.nota, a.data_publicacao,
            u.id_usuario, u.nome_usuario,
            j.id_jogo, j.nome_jogo, j.capa
     FROM avaliacao a
     JOIN usuario u ON u.id_usuario = a.id_usuario_fk
     JOIN jogo    j ON j.id_jogo    = a.id_jogo_fk
     ${where}
     ORDER BY a.data_publicacao DESC`,
    params,
  );

  return rows.map(mapAvaliacao);
}

async function readById(id: number): Promise<Avaliacao> {
  const db = await Database.connect();

  const avaliacao = await db.get(
    `SELECT a.*, u.nome_usuario, j.nome_jogo, j.capa, j.id_jogo
     FROM avaliacao a
     JOIN usuario u ON u.id_usuario = a.id_usuario_fk
     JOIN jogo    j ON j.id_jogo    = a.id_jogo_fk
     WHERE a.id_avaliacao = ?`,
    [id],
  );

  if (!avaliacao) throw new HttpError('Avaliação não encontrada', 404);
  return mapAvaliacao(avaliacao);
}

async function create({ id_usuario_fk, id_jogo_fk, nota, titulo, texto }: AvaliacaoInput): Promise<Avaliacao> {
  const db = await Database.connect();

  if (!id_usuario_fk || !id_jogo_fk || nota === undefined || !titulo || !texto) {
    throw new HttpError('Campos obrigatórios: id_usuario_fk, id_jogo_fk, nota, titulo, texto');
  }

  const notaNum = parseFloat(String(nota));
  if (isNaN(notaNum) || notaNum < 1 || notaNum > 5) {
    throw new HttpError('A nota deve ser um número entre 1 e 5');
  }

  const jaAvaliou = await db.get(`SELECT 1 FROM avaliacao WHERE id_usuario_fk = ? AND id_jogo_fk = ?`, [id_usuario_fk, id_jogo_fk]);
  if (jaAvaliou) throw new HttpError('Você já avaliou este jogo', 409);

  const { lastID } = await db.run(
    `INSERT INTO avaliacao (id_usuario_fk, id_jogo_fk, nota, titulo, texto) VALUES (?, ?, ?, ?, ?)`,
    [id_usuario_fk, id_jogo_fk, notaNum, titulo, texto],
  );

  await Jogo.atualizarNota(id_jogo_fk);
  return await readById(lastID);
}

async function update({ id, nota, titulo, texto }: AvaliacaoInput & { id?: number }): Promise<Avaliacao> {
  const db = await Database.connect();

  if (!id || nota === undefined || !titulo || !texto) {
    throw new HttpError('Campos obrigatórios: nota, titulo, texto');
  }

  const notaNum = parseFloat(String(nota));
  if (isNaN(notaNum) || notaNum < 1 || notaNum > 5) {
    throw new HttpError('A nota deve ser um número entre 1 e 5');
  }

  const { changes } = await db.run(
    `UPDATE avaliacao SET nota = ?, titulo = ?, texto = ? WHERE id_avaliacao = ?`,
    [notaNum, titulo, texto, id],
  );

  if (changes === 1) {
    const av = await readById(id);
    await Jogo.atualizarNota(av.id_jogo_fk);
    return av;
  }

  throw new HttpError('Avaliação não encontrada', 404);
}

async function remove(id: number): Promise<boolean> {
  const db = await Database.connect();
  const av = await readById(id);

  const { changes } = await db.run(`DELETE FROM avaliacao WHERE id_avaliacao = ?`, [id]);

  if (changes === 1) {
    await Jogo.atualizarNota(av.id_jogo_fk);
    return true;
  }

  throw new HttpError('Avaliação não encontrada', 404);
}

async function getDestaque(): Promise<Avaliacao[]> {
  const db = await Database.connect();
  const rows = await db.all(
    `SELECT a.id_avaliacao, a.titulo, a.texto, a.nota, a.data_publicacao,
            u.id_usuario, u.nome_usuario,
            j.id_jogo, j.nome_jogo, j.capa
     FROM avaliacao a
     JOIN usuario u ON u.id_usuario = a.id_usuario_fk
     JOIN jogo    j ON j.id_jogo    = a.id_jogo_fk
     ORDER BY a.nota DESC, a.data_publicacao DESC LIMIT 6`,
  );

  return rows.map(mapAvaliacao);
}

export default { readAll, readById, create, update, remove, getDestaque };
