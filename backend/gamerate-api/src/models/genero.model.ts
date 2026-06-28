import Database from '@/database/database.ts';
import HttpError from '@/errors/HttpError.ts';
import type { Genero, GeneroInput } from '@/types/Genero.d.ts';

function mapGenero(row: Record<string, unknown>): Genero {
  return {
    id_genero: row.id_genero as number,
    nome_genero: row.nome_genero as string,
    total_jogos: row.total_jogos as number | undefined,
  };
}

async function readAll(): Promise<Genero[]> {
  const db = await Database.connect();
  const rows = await db.all(
    `SELECT g.id_genero, g.nome_genero, COUNT(DISTINCT jg.id_jogo_fk) AS total_jogos
     FROM genero g
     LEFT JOIN jogo_genero jg ON jg.id_genero_fk = g.id_genero
     GROUP BY g.id_genero, g.nome_genero
     ORDER BY g.nome_genero`,
  );
  return rows.map(mapGenero);
}

async function readById(id: number): Promise<Genero> {
  const db = await Database.connect();
  const row = await db.get(`SELECT id_genero, nome_genero FROM genero WHERE id_genero = ?`, [id]);

  if (row) return mapGenero(row);
  throw new HttpError('Gênero não encontrado', 404);
}

async function create(data: GeneroInput): Promise<Genero> {
  const db = await Database.connect();
  const { nome_genero } = data;

  if (!nome_genero) throw new HttpError('O campo nome_genero é obrigatório');

  const { lastID } = await db.run(`INSERT INTO genero (nome_genero) VALUES (?)`, [nome_genero]);
  return await readById(lastID);
}

async function remove(id: number): Promise<boolean> {
  const db = await Database.connect();
  const { changes } = await db.run(`DELETE FROM genero WHERE id_genero = ?`, [id]);

  if (changes === 1) return true;
  throw new HttpError('Gênero não encontrado', 404);
}

export default { readAll, readById, create, remove };