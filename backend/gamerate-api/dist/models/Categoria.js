import Database from '../database/database.js';
import HttpError from '../errors/HttpError.js';
function mapGenero(row) {
    return {
        id_genero: row.id_genero,
        nome_genero: row.nome_genero,
        total_jogos: row.total_jogos,
    };
}
function mapPlataforma(row) {
    return {
        id_plataforma: row.id_plataforma,
        nome_plataforma: row.nome_plataforma,
        total_jogos: row.total_jogos,
    };
}
function Categoria(tabela, colId, colNome, mapRow) {
    async function readAll() {
        const db = await Database.connect();
        if (tabela === 'genero') {
            const rows = await db.all(`SELECT g.${colId}, g.${colNome}, COUNT(DISTINCT jg.id_jogo_fk) AS total_jogos
         FROM ${tabela} g
         LEFT JOIN jogo_genero jg ON jg.id_genero_fk = g.${colId}
         GROUP BY g.${colId}, g.${colNome}
         ORDER BY g.${colNome}`);
            return rows.map(mapRow);
        }
        const rows = await db.all(`SELECT p.${colId}, p.${colNome}, COUNT(DISTINCT jp.id_jogo_fk) AS total_jogos
       FROM ${tabela} p
       LEFT JOIN jogo_plataforma jp ON jp.id_plataforma_fk = p.${colId}
       GROUP BY p.${colId}, p.${colNome}
       ORDER BY p.${colNome}`);
        return rows.map(mapRow);
    }
    async function readById(id) {
        const db = await Database.connect();
        const row = await db.get(`SELECT ${colId}, ${colNome} FROM ${tabela} WHERE ${colId} = ?`, [id]);
        if (row)
            return mapRow(row);
        throw new HttpError(`${tabela} não encontrado`, 404);
    }
    async function create(data) {
        const db = await Database.connect();
        const nome = tabela === 'genero'
            ? data.nome_genero
            : data.nome_plataforma;
        if (!nome)
            throw new HttpError(`O campo ${colNome} é obrigatório`);
        const { lastID } = await db.run(`INSERT INTO ${tabela} (${colNome}) VALUES (?)`, [nome]);
        return await readById(lastID);
    }
    async function remove(id) {
        const db = await Database.connect();
        const { changes } = await db.run(`DELETE FROM ${tabela} WHERE ${colId} = ?`, [id]);
        if (changes === 1)
            return true;
        throw new HttpError(`${tabela} não encontrado`, 404);
    }
    return { readAll, readById, create, remove };
}
export const Genero = Categoria('genero', 'id_genero', 'nome_genero', mapGenero);
export const Plataforma = Categoria('plataforma', 'id_plataforma', 'nome_plataforma', mapPlataforma);
