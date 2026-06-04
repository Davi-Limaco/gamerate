/**
 * models/Categoria.ts — Model genérico para tabelas de categoria simples (genero, plataforma)
 */

import Database from '../database/database.js';
import { notFound } from '../errors/HttpError.js';

interface CategoryRow {
  [key: string]: any;
}

interface CategoryFunctions {
  readAll(): Promise<CategoryRow[]>;
  readById(id: number): Promise<CategoryRow>;
  create(data: { [key: string]: string }): Promise<CategoryRow>;
  remove(id: number): Promise<boolean>;
}

/**
 * Factory function para criar models de categorias genéricas
 * @param tabela - Nome da tabela no banco
 * @param colId - Coluna de ID (ex: id_genero)
 * @param colNome - Coluna de nome (ex: nome_genero)
 */
function Categoria(tabela: string, colId: string, colNome: string): CategoryFunctions {
  async function readAll(): Promise<CategoryRow[]> {
    const db = await Database.connect();

    if (tabela === 'genero') {
      return await db.all(
        `SELECT g.${colId}, g.${colNome}, COUNT(DISTINCT jg.id_jogo_fk) AS total_jogos
         FROM ${tabela} g
         LEFT JOIN jogo_genero jg ON jg.id_genero_fk = g.${colId}
         GROUP BY g.${colId}, g.${colNome}
         ORDER BY g.${colNome}`
      );
    }

    if (tabela === 'plataforma') {
      return await db.all(
        `SELECT p.${colId}, p.${colNome}, COUNT(DISTINCT jp.id_jogo_fk) AS total_jogos
         FROM ${tabela} p
         LEFT JOIN jogo_plataforma jp ON jp.id_plataforma_fk = p.${colId}
         GROUP BY p.${colId}, p.${colNome}
         ORDER BY p.${colNome}`
      );
    }

    return await db.all(`SELECT ${colId}, ${colNome} FROM ${tabela} ORDER BY ${colNome}`);
  }

  async function readById(id: number): Promise<CategoryRow> {
    const db = await Database.connect();
    const row = await db.get<CategoryRow>(
      `SELECT ${colId}, ${colNome} FROM ${tabela} WHERE ${colId} = ?`,
      [id]
    );
    if (row) return row;
    throw notFound(`${tabela} não encontrado`);
  }

  async function create(data: { [key: string]: string }): Promise<CategoryRow> {
    const db = await Database.connect();
    const nome = data[colNome];
    if (!nome) throw new Error(`O campo ${colNome} é obrigatório`);

    const { lastID } = await db.run(
      `INSERT INTO ${tabela} (${colNome}) VALUES (?)`,
      [nome]
    );
    return await readById(lastID);
  }

  async function remove(id: number): Promise<boolean> {
    const db = await Database.connect();
    const { changes } = await db.run(`DELETE FROM ${tabela} WHERE ${colId} = ?`, [id]);

    if (changes === 1) return true;
    throw notFound(`${tabela} não encontrado`);
  }

  return { readAll, readById, create, remove };
}

export const Genero = Categoria('genero', 'id_genero', 'nome_genero');
export const Plataforma = Categoria('plataforma', 'id_plataforma', 'nome_plataforma');
