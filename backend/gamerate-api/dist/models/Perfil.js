import Database from '@/database/database';
async function readAll() {
    const db = await Database.connect();
    const sql = `SELECT id_perfil, nome_perfil FROM perfil ORDER BY id_perfil`;
    return await db.all(sql);
}
async function readById(id) {
    const db = await Database.connect();
    const sql = `SELECT id_perfil, nome_perfil FROM perfil WHERE id_perfil = ?`;
    const perfil = await db.get(sql, [id]);
    if (perfil)
        return perfil;
    throw new Error('Perfil não encontrado');
}
async function create({ nome_perfil }) {
    const db = await Database.connect();
    if (nome_perfil) {
        const sql = `INSERT INTO perfil (nome_perfil) VALUES (?)`;
        const { lastID } = await db.run(sql, [nome_perfil]);
        return await readById(lastID);
    }
    throw new Error('Unable to create perfil');
}
async function update({ id, nome_perfil }) {
    const db = await Database.connect();
    if (id && nome_perfil) {
        const sql = `UPDATE perfil SET nome_perfil = ? WHERE id_perfil = ?`;
        const { changes } = await db.run(sql, [nome_perfil, id]);
        if (changes === 1)
            return readById(id);
        throw new Error('Perfil não encontrado');
    }
    throw new Error('Unable to update perfil');
}
async function remove(id) {
    const db = await Database.connect();
    if (id) {
        const sql = `DELETE FROM perfil WHERE id_perfil = ?`;
        const { changes } = await db.run(sql, [id]);
        if (changes === 1)
            return true;
        throw new Error('Perfil não encontrado');
    }
    throw new Error('Unable to remove perfil');
}
export default { readAll, readById, create, update, remove };
