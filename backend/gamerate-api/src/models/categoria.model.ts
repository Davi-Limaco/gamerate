import Database from '@/database/database.ts';
import HttpError from '@/errors/HttpError.ts';
import type { Genero as GeneroType, Plataforma as PlataformaType, GeneroInput, PlataformaInput } from '@/types/Jogo.d.ts';

function mapGenero(row: Record<string, unknown>): GeneroType {
  return {
    id_genero: row.id_genero as number,
    nome_genero: row.nome_genero as string,
    total_jogos: row.total_jogos as number | undefined,
  };
}

function mapPlataforma(row: Record<string, unknown>): PlataformaType {
  return {
    id_plataforma: row.id_plataforma as number,
    nome_plataforma: row.nome_plataforma as string,
    total_jogos: row.total_jogos as number | undefined,
  };
}

function Categoria<T extends GeneroType | PlataformaType>(
  tabela: 'genero' | 'plataforma',
  colId: string,
  colNome: string,
  mapRow: (row: Record<string, unknown>) => T,
) {
  async function readAll(): Promise<T[]> {
    const db = await Database.connect();

    if (tabela === 'genero') {
      const rows = await db.all(
        `SELECT g.${colId}, g.${colNome}, COUNT(DISTINCT jg.id_jogo_fk) AS total_jogos
         FROM ${tabela} g
         LEFT JOIN jogo_genero jg ON jg.id_genero_fk = g.${colId}
         GROUP BY g.${colId}, g.${colNome}
         ORDER BY g.${colNome}`,
      );
      return rows.map(mapRow);
    }

    const rows = await db.all(
      `SELECT p.${colId}, p.${colNome}, COUNT(DISTINCT jp.id_jogo_fk) AS total_jogos
       FROM ${tabela} p
       LEFT JOIN jogo_plataforma jp ON jp.id_plataforma_fk = p.${colId}
       GROUP BY p.${colId}, p.${colNome}
       ORDER BY p.${colNome}`,
    );
    return rows.map(mapRow);
  }

  async function readById(id: number): Promise<T> {
    const db = await Database.connect();
    const row = await db.get(`SELECT ${colId}, ${colNome} FROM ${tabela} WHERE ${colId} = ?`, [id]);

    if (row) return mapRow(row);
    throw new HttpError(`${tabela} não encontrado`, 404);
  }

  async function create(data: GeneroInput | PlataformaInput): Promise<T> {
    const db = await Database.connect();
    const nome = tabela === 'genero'
      ? (data as GeneroInput).nome_genero
      : (data as PlataformaInput).nome_plataforma;

    if (!nome) throw new HttpError(`O campo ${colNome} é obrigatório`);

    const { lastID } = await db.run(`INSERT INTO ${tabela} (${colNome}) VALUES (?)`, [nome]);
    return await readById(lastID);
  }

  async function remove(id: number): Promise<boolean> {
    const db = await Database.connect();
    const { changes } = await db.run(`DELETE FROM ${tabela} WHERE ${colId} = ?`, [id]);

    if (changes === 1) return true;
    throw new HttpError(`${tabela} não encontrado`, 404);
  }

  return { readAll, readById, create, remove };
}

export const Genero     = Categoria('genero',     'id_genero',    'nome_genero',    mapGenero);
export const Plataforma = Categoria('plataforma', 'id_plataforma', 'nome_plataforma', mapPlataforma);
