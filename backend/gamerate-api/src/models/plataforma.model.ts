import Database from '@/database/database.ts';
import HttpError from '@/errors/HttpError.ts';
import type { Plataforma, PlataformaInput } from '@/types/Plataforma.d.ts';

function mapPlataforma(row: Record<string, unknown>): Plataforma {
  return {
    id_plataforma: row.id_plataforma as number,
    nome_plataforma: row.nome_plataforma as string,
    total_jogos: row.total_jogos as number | undefined,
  };
}

async function readAll(): Promise<Plataforma[]> {
  const db = await Database.connect();
  const rows = await db.all(
    `SELECT p.id_plataforma, p.nome_plataforma, COUNT(DISTINCT jp.id_jogo_fk) AS total_jogos
     FROM plataforma p
     LEFT JOIN jogo_plataforma jp ON jp.id_plataforma_fk = p.id_plataforma
     GROUP BY p.id_plataforma, p.nome_plataforma
     ORDER BY p.nome_plataforma`,
  );
  return rows.map(mapPlataforma);
}

async function readById(id: number): Promise<Plataforma> {
  const db = await Database.connect();
  const row = await db.get(`SELECT id_plataforma, nome_plataforma FROM plataforma WHERE id_plataforma = ?`, [id]);

  if (row) return mapPlataforma(row);
  throw new HttpError('Plataforma não encontrada', 404);
}

async function create(data: PlataformaInput): Promise<Plataforma> {
  const db = await Database.connect();
  const { nome_plataforma } = data;

  if (!nome_plataforma) throw new HttpError('O campo nome_plataforma é obrigatório');

  const { lastID } = await db.run(`INSERT INTO plataforma (nome_plataforma) VALUES (?)`, [nome_plataforma]);
  return await readById(lastID);
}

async function remove(id: number): Promise<boolean> {
  const db = await Database.connect();
  const { changes } = await db.run(`DELETE FROM plataforma WHERE id_plataforma = ?`, [id]);

  if (changes === 1) return true;
  throw new HttpError('Plataforma não encontrada', 404);
}

export default { readAll, readById, create, remove };