import Database from '../database/database.js';
import HttpError from '../errors/HttpError.js';
function mapPerfil(row) {
    return {
        id_perfil: row.id_perfil,
        nome_perfil: row.nome_perfil,
    };
}
async function readAll() {
    const db = await Database.connect();
    const rows = await db.all(`SELECT id_perfil, nome_perfil FROM perfil ORDER BY id_perfil`);
    return rows.map(mapPerfil);
}
async function readById(id) {
    const db = await Database.connect();
    const perfil = await db.get(`SELECT id_perfil, nome_perfil FROM perfil WHERE id_perfil = ?`, [id]);
    if (perfil)
        return mapPerfil(perfil);
    throw new HttpError('Perfil não encontrado', 404);
}
async function create({ nome_perfil }) {
    const db = await Database.connect();
    if (!nome_perfil)
        throw new HttpError('O campo nome_perfil é obrigatório');
    const { lastID } = await db.run(`INSERT INTO perfil (nome_perfil) VALUES (?)`, [nome_perfil]);
    return await readById(lastID);
}
async function update({ id, nome_perfil }) {
    const db = await Database.connect();
    if (!id || !nome_perfil)
        throw new HttpError('Os campos id e nome_perfil são obrigatórios');
    const { changes } = await db.run(`UPDATE perfil SET nome_perfil = ? WHERE id_perfil = ?`, [nome_perfil, id]);
    if (changes === 1)
        return await readById(id);
    throw new HttpError('Perfil não encontrado', 404);
}
async function remove(id) {
    const db = await Database.connect();
    const { changes } = await db.run(`DELETE FROM perfil WHERE id_perfil = ?`, [id]);
    if (changes === 1)
        return true;
    throw new HttpError('Perfil não encontrado', 404);
}
export default { readAll, readById, create, update, remove };
