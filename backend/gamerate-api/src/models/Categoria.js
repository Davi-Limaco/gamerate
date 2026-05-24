import Database from '../database/database.js';

/**
 * Model genérico para tabelas de categoria simples (genero, plataforma).
 * Recebe o nome da tabela e da coluna de nome como parâmetros,
 * evitando repetição de código entre models idênticos.
 *
 * Uso:
 *   const Genero    = Categoria('genero',    'id_genero',    'nome_genero');
 *   const Plataforma = Categoria('plataforma', 'id_plataforma', 'nome_plataforma');
 */
function Categoria(tabela, colId, colNome) {

  async function readAll() {
    const db = await Database.connect();
    
    // Se for gênero, incluir contagem de jogos
    if (tabela === 'genero') {
      return await db.all(
        `SELECT g.${colId}, g.${colNome}, COUNT(DISTINCT jg.id_jogo_fk) AS total_jogos
         FROM ${tabela} g
         LEFT JOIN jogo_genero jg ON jg.id_genero_fk = g.${colId}
         GROUP BY g.${colId}, g.${colNome}
         ORDER BY g.${colNome}`
      );
    }
    
    // Se for plataforma, incluir contagem de jogos
    if (tabela === 'plataforma') {
      return await db.all(
        `SELECT p.${colId}, p.${colNome}, COUNT(DISTINCT jp.id_jogo_fk) AS total_jogos
         FROM ${tabela} p
         LEFT JOIN jogo_plataforma jp ON jp.id_plataforma_fk = p.${colId}
         GROUP BY p.${colId}, p.${colNome}
         ORDER BY p.${colNome}`
      );
    }
    
    // Padrão para outras tabelas
    return await db.all(
      `SELECT ${colId}, ${colNome} FROM ${tabela} ORDER BY ${colNome}`
    );
  }

  async function readById(id) {
    const db = await Database.connect();
    const row = await db.get(
      `SELECT ${colId}, ${colNome} FROM ${tabela} WHERE ${colId} = ?`, [id]
    );
    if (row) return row;
    throw new Error(`${tabela} não encontrado`);
  }

  async function create({ [colNome]: nome }) {
    const db = await Database.connect();
    if (!nome) throw new Error(`O campo ${colNome} é obrigatório`);
    const { lastID } = await db.run(
      `INSERT INTO ${tabela} (${colNome}) VALUES (?)`, [nome]
    );
    return await readById(lastID);
  }

  async function remove(id) {
    const db = await Database.connect();
    const { changes } = await db.run(
      `DELETE FROM ${tabela} WHERE ${colId} = ?`, [id]
    );
    if (changes === 1) return true;
    throw new Error(`${tabela} não encontrado`);
  }

  return { readAll, readById, create, remove };
}

export const Genero     = Categoria('genero',    'id_genero',    'nome_genero');
export const Plataforma = Categoria('plataforma', 'id_plataforma', 'nome_plataforma');
