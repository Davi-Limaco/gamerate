import Database from '@/database/database';
async function readAll() {
    const db = await Database.connect();
    return await db.all(`SELECT * FROM comunicacao_site ORDER BY data_comunicacao DESC`);
}
async function readById(id) {
    const db = await Database.connect();
    const contato = await db.get(`SELECT * FROM comunicacao_site WHERE id_comunicacao = ?`, [id]);
    if (contato)
        return contato;
    throw new Error('Contato não encontrado');
}
async function create({ email_contato, tipo, mensagem }) {
    const db = await Database.connect();
    if (email_contato && tipo && mensagem) {
        const sql = `
      INSERT INTO comunicacao_site (email_contato, tipo, mensagem)
      VALUES (?, ?, ?)
    `;
        const { lastID } = await db.run(sql, [email_contato, tipo, mensagem]);
        return await readById(lastID);
    }
    throw new Error('Unable to create contato');
}
async function remove(id) {
    const db = await Database.connect();
    const { changes } = await db.run(`DELETE FROM comunicacao_site WHERE id_comunicacao = ?`, [id]);
    if (changes === 1)
        return true;
    throw new Error('Contato não encontrado');
}
export default { readAll, readById, create, remove };
