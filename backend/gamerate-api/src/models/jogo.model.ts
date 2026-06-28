import Database from '@/database/database.ts';
import type { Jogo, JogoInput, JogoResumo, JogoFilter } from '@/types/Jogo.d.ts';
import type { Genero } from '@/types/Genero.d.ts';
import type { Plataforma } from '@/types/Plataforma.d.ts';
import HttpError from '@/errors/HttpError.ts';

function mapJogoResumo(row: Record<string, unknown>): JogoResumo {
  return {
    id_jogo: row.id_jogo as number,
    nome_jogo: row.nome_jogo as string,
    desenvolvedora: row.desenvolvedora as string,
    data_lancamento: row.data_lancamento as string,
    nota_media: row.nota_media as number | null,
    total_avaliacoes: row.total_avaliacoes as number,
    capa: row.capa as string | null,
  };
}

function mapGenero(row: Record<string, unknown>): Genero {
  return {
    id_genero: row.id_genero as number,
    nome_genero: row.nome_genero as string,
  };
}

function mapPlataforma(row: Record<string, unknown>): Plataforma {
  return {
    id_plataforma: row.id_plataforma as number,
    nome_plataforma: row.nome_plataforma as string,
  };
}

function mapJogo(row: Record<string, unknown>): Jogo {
  return {
    id_jogo: row.id_jogo as number,
    nome_jogo: row.nome_jogo as string,
    desenvolvedora: row.desenvolvedora as string,
    data_lancamento: row.data_lancamento as string,
    descricao: row.descricao as string,
    nota_media: row.nota_media as number | null,
    total_avaliacoes: row.total_avaliacoes as number,
    capa: row.capa as string | null,
  };
}

async function readAll(filter?: JogoFilter): Promise<JogoResumo[]> {
  const db = await Database.connect();

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filter?.search)     { conditions.push(`j.nome_jogo LIKE ?`);       params.push(`%${filter.search}%`); }
  if (filter?.genero)     { conditions.push(`g.nome_genero = ?`);         params.push(filter.genero); }
  if (filter?.plataforma) { conditions.push(`pl.nome_plataforma = ?`);    params.push(filter.plataforma); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const sql = `
    SELECT DISTINCT j.id_jogo, j.nome_jogo, j.desenvolvedora,
                    j.data_lancamento, j.nota_media, j.total_avaliacoes, j.capa
    FROM jogo j
    LEFT JOIN jogo_genero     jg ON jg.id_jogo_fk   = j.id_jogo
    LEFT JOIN genero          g  ON g.id_genero      = jg.id_genero_fk
    LEFT JOIN jogo_plataforma jp ON jp.id_jogo_fk    = j.id_jogo
    LEFT JOIN plataforma      pl ON pl.id_plataforma = jp.id_plataforma_fk
    ${where}
    ORDER BY j.nome_jogo ASC
  `;

  const rows = await db.all(sql, params);
  return rows.map(mapJogoResumo);
}

async function readById(id: number): Promise<Jogo> {
  const db = await Database.connect();

  const jogo = await db.get(`SELECT * FROM jogo WHERE id_jogo = ?`, [id]);
  if (!jogo) throw new HttpError('Jogo não encontrado', 404);

  const generos = (await db.all(
    `SELECT g.id_genero, g.nome_genero FROM genero g
     JOIN jogo_genero jg ON jg.id_genero_fk = g.id_genero WHERE jg.id_jogo_fk = ?`, [id],
  )).map(mapGenero);

  const plataformas = (await db.all(
    `SELECT p.id_plataforma, p.nome_plataforma FROM plataforma p
     JOIN jogo_plataforma jp ON jp.id_plataforma_fk = p.id_plataforma WHERE jp.id_jogo_fk = ?`, [id],
  )).map(mapPlataforma);

  return { ...mapJogo(jogo), generos, plataformas };
}

async function create({ nome_jogo, desenvolvedora, data_lancamento, descricao, capa, generos = [], plataformas = [] }: JogoInput): Promise<Jogo> {
  const db = await Database.connect();

  if (!nome_jogo || !desenvolvedora || !data_lancamento || !descricao) {
    throw new HttpError('Campos obrigatórios: nome_jogo, desenvolvedora, data_lancamento, descricao');
  }

  const { lastID } = await db.run(
    `INSERT INTO jogo (nome_jogo, desenvolvedora, data_lancamento, descricao, nota_media, total_avaliacoes, capa)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [nome_jogo, desenvolvedora, data_lancamento, descricao, null, 0, capa ?? null],
  );

  for (const gId of generos)     await db.run(`INSERT OR IGNORE INTO jogo_genero     (id_jogo_fk, id_genero_fk)    VALUES (?, ?)`, [lastID, gId]);
  for (const pId of plataformas) await db.run(`INSERT OR IGNORE INTO jogo_plataforma (id_jogo_fk, id_plataforma_fk) VALUES (?, ?)`, [lastID, pId]);

  return await readById(lastID);
}

async function update({ id, nome_jogo, desenvolvedora, data_lancamento, descricao, capa }: JogoInput & { id?: number }): Promise<Jogo> {
  const db = await Database.connect();

  if (!id || !nome_jogo || !desenvolvedora || !data_lancamento || !descricao) {
    throw new HttpError('Campos obrigatórios: id, nome_jogo, desenvolvedora, data_lancamento, descricao');
  }

  const { changes } = await db.run(
    `UPDATE jogo SET nome_jogo = ?, desenvolvedora = ?, data_lancamento = ?, descricao = ?, capa = ? WHERE id_jogo = ?`,
    [nome_jogo, desenvolvedora, data_lancamento, descricao, capa ?? null, id],
  );

  if (changes === 1) return readById(id!);
  throw new HttpError('Jogo não encontrado', 404);
}

async function remove(id: number): Promise<boolean> {
  const db = await Database.connect();

  await db.run(`DELETE FROM jogo_genero     WHERE id_jogo_fk = ?`, [id]);
  await db.run(`DELETE FROM jogo_plataforma WHERE id_jogo_fk = ?`, [id]);

  const { changes } = await db.run(`DELETE FROM jogo WHERE id_jogo = ?`, [id]);
  if (changes === 1) return true;
  throw new HttpError('Jogo não encontrado', 404);
}

async function atualizarNota(id: number): Promise<void> {
  const db = await Database.connect();
  const nota = await db.get(`SELECT AVG(nota) AS media, COUNT(*) AS total FROM avaliacao WHERE id_jogo_fk = ?`, [id]) as { media: number | null; total: number } | undefined;
  await db.run(`UPDATE jogo SET nota_media = ?, total_avaliacoes = ? WHERE id_jogo = ?`, [nota?.media ?? null, nota?.total ?? 0, id]);
}

async function getStats() {
  const db = await Database.connect();
  const total_jogos    = await db.get(`SELECT COUNT(*) AS count FROM jogo`)        as { count: number } | undefined;
  const total_aval     = await db.get(`SELECT COUNT(*) AS count FROM avaliacao`)   as { count: number } | undefined;
  const total_usuarios = await db.get(`SELECT COUNT(*) AS count FROM usuario`)     as { count: number } | undefined;
  const total_plat     = await db.get(`SELECT COUNT(*) AS count FROM plataforma`)  as { count: number } | undefined;

  return {
    total_jogos:     total_jogos?.count    ?? 0,
    total_aval:      total_aval?.count     ?? 0,
    total_usuarios:  total_usuarios?.count ?? 0,
    total_plat:      total_plat?.count     ?? 0,
  };
}

async function getDestaques() {
  const db = await Database.connect();

  const lancamentos = (await db.all(
    `SELECT id_jogo, nome_jogo, desenvolvedora, data_lancamento, nota_media, total_avaliacoes, capa
     FROM jogo ORDER BY data_lancamento DESC LIMIT 8`,
  )).map(mapJogoResumo);

  const melhores = (await db.all(
    `SELECT id_jogo, nome_jogo, desenvolvedora, data_lancamento, nota_media, total_avaliacoes, capa
     FROM jogo WHERE nota_media IS NOT NULL ORDER BY nota_media DESC LIMIT 8`,
  )).map(mapJogoResumo);

  return { lancamentos, melhores };
}

export default { readAll, readById, create, update, remove, atualizarNota, getStats, getDestaques };
