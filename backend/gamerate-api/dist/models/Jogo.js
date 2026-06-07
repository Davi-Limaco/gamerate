import Database from '../database/database.js';
import HttpError from '../errors/HttpError.js';
function mapJogoResumo(row) {
    return {
        id_jogo: row.id_jogo,
        nome_jogo: row.nome_jogo,
        desenvolvedora: row.desenvolvedora,
        data_lancamento: row.data_lancamento,
        nota_media: row.nota_media,
        total_avaliacoes: row.total_avaliacoes,
        capa: row.capa,
    };
}
function mapGenero(row) {
    return {
        id_genero: row.id_genero,
        nome_genero: row.nome_genero,
    };
}
function mapPlataforma(row) {
    return {
        id_plataforma: row.id_plataforma,
        nome_plataforma: row.nome_plataforma,
    };
}
function mapJogo(row) {
    return {
        id_jogo: row.id_jogo,
        nome_jogo: row.nome_jogo,
        desenvolvedora: row.desenvolvedora,
        data_lancamento: row.data_lancamento,
        descricao: row.descricao,
        nota_media: row.nota_media,
        total_avaliacoes: row.total_avaliacoes,
        capa: row.capa,
    };
}
async function readAll(filter) {
    const db = await Database.connect();
    const conditions = [];
    const params = [];
    if (filter?.search) {
        conditions.push(`j.nome_jogo LIKE ?`);
        params.push(`%${filter.search}%`);
    }
    if (filter?.genero) {
        conditions.push(`g.nome_genero = ?`);
        params.push(filter.genero);
    }
    if (filter?.plataforma) {
        conditions.push(`pl.nome_plataforma = ?`);
        params.push(filter.plataforma);
    }
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
async function readById(id) {
    const db = await Database.connect();
    const jogo = await db.get(`SELECT * FROM jogo WHERE id_jogo = ?`, [id]);
    if (!jogo)
        throw new HttpError('Jogo não encontrado', 404);
    const generos = (await db.all(`SELECT g.id_genero, g.nome_genero FROM genero g
     JOIN jogo_genero jg ON jg.id_genero_fk = g.id_genero WHERE jg.id_jogo_fk = ?`, [id])).map(mapGenero);
    const plataformas = (await db.all(`SELECT p.id_plataforma, p.nome_plataforma FROM plataforma p
     JOIN jogo_plataforma jp ON jp.id_plataforma_fk = p.id_plataforma WHERE jp.id_jogo_fk = ?`, [id])).map(mapPlataforma);
    return { ...mapJogo(jogo), generos, plataformas };
}
async function create({ nome_jogo, desenvolvedora, data_lancamento, descricao, capa, generos = [], plataformas = [] }) {
    const db = await Database.connect();
    if (!nome_jogo || !desenvolvedora || !data_lancamento || !descricao) {
        throw new HttpError('Campos obrigatórios: nome_jogo, desenvolvedora, data_lancamento, descricao');
    }
    const { lastID } = await db.run(`INSERT INTO jogo (nome_jogo, desenvolvedora, data_lancamento, descricao, nota_media, total_avaliacoes, capa)
     VALUES (?, ?, ?, ?, ?, ?, ?)`, [nome_jogo, desenvolvedora, data_lancamento, descricao, null, 0, capa ?? null]);
    for (const gId of generos)
        await db.run(`INSERT OR IGNORE INTO jogo_genero     (id_jogo_fk, id_genero_fk)    VALUES (?, ?)`, [lastID, gId]);
    for (const pId of plataformas)
        await db.run(`INSERT OR IGNORE INTO jogo_plataforma (id_jogo_fk, id_plataforma_fk) VALUES (?, ?)`, [lastID, pId]);
    return await readById(lastID);
}
async function update({ id, nome_jogo, desenvolvedora, data_lancamento, descricao, capa }) {
    const db = await Database.connect();
    if (!id || !nome_jogo || !desenvolvedora || !data_lancamento || !descricao) {
        throw new HttpError('Campos obrigatórios: id, nome_jogo, desenvolvedora, data_lancamento, descricao');
    }
    const { changes } = await db.run(`UPDATE jogo SET nome_jogo = ?, desenvolvedora = ?, data_lancamento = ?, descricao = ?, capa = ? WHERE id_jogo = ?`, [nome_jogo, desenvolvedora, data_lancamento, descricao, capa ?? null, id]);
    if (changes === 1)
        return readById(id);
    throw new HttpError('Jogo não encontrado', 404);
}
async function remove(id) {
    const db = await Database.connect();
    await db.run(`DELETE FROM jogo_genero     WHERE id_jogo_fk = ?`, [id]);
    await db.run(`DELETE FROM jogo_plataforma WHERE id_jogo_fk = ?`, [id]);
    const { changes } = await db.run(`DELETE FROM jogo WHERE id_jogo = ?`, [id]);
    if (changes === 1)
        return true;
    throw new HttpError('Jogo não encontrado', 404);
}
async function atualizarNota(id) {
    const db = await Database.connect();
    const nota = await db.get(`SELECT AVG(nota) AS media, COUNT(*) AS total FROM avaliacao WHERE id_jogo_fk = ?`, [id]);
    await db.run(`UPDATE jogo SET nota_media = ?, total_avaliacoes = ? WHERE id_jogo = ?`, [nota?.media ?? null, nota?.total ?? 0, id]);
}
async function getStats() {
    const db = await Database.connect();
    const total_jogos = await db.get(`SELECT COUNT(*) AS count FROM jogo`);
    const total_aval = await db.get(`SELECT COUNT(*) AS count FROM avaliacao`);
    const total_usuarios = await db.get(`SELECT COUNT(*) AS count FROM usuario`);
    const total_plat = await db.get(`SELECT COUNT(*) AS count FROM plataforma`);
    return {
        total_jogos: total_jogos?.count ?? 0,
        total_aval: total_aval?.count ?? 0,
        total_usuarios: total_usuarios?.count ?? 0,
        total_plat: total_plat?.count ?? 0,
    };
}
async function getDestaques() {
    const db = await Database.connect();
    const lancamentos = (await db.all(`SELECT id_jogo, nome_jogo, desenvolvedora, data_lancamento, nota_media, total_avaliacoes, capa
     FROM jogo ORDER BY data_lancamento DESC LIMIT 8`)).map(mapJogoResumo);
    const melhores = (await db.all(`SELECT id_jogo, nome_jogo, desenvolvedora, data_lancamento, nota_media, total_avaliacoes, capa
     FROM jogo WHERE nota_media IS NOT NULL ORDER BY nota_media DESC LIMIT 8`)).map(mapJogoResumo);
    return { lancamentos, melhores };
}
export default { readAll, readById, create, update, remove, atualizarNota, getStats, getDestaques };
