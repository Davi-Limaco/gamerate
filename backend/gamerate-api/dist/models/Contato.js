import Database from '../database/database.js';
import HttpError from '../errors/HttpError.js';
function mapContato(row) {
    return {
        id_comunicacao: row.id_comunicacao,
        email_contato: row.email_contato,
        tipo: row.tipo,
        mensagem: row.mensagem,
        data_envio: (row.data_comunicacao ?? row.data_envio),
    };
}
async function readAll() {
    const db = await Database.connect();
    const rows = await db.all(`SELECT * FROM comunicacao_site ORDER BY data_comunicacao DESC`);
    return rows.map(mapContato);
}
async function readById(id) {
    const db = await Database.connect();
    const contato = await db.get(`SELECT * FROM comunicacao_site WHERE id_comunicacao = ?`, [id]);
    if (contato)
        return mapContato(contato);
    throw new HttpError('Contato não encontrado', 404);
}
async function create({ email_contato, tipo, mensagem }) {
    const db = await Database.connect();
    if (!email_contato || !tipo || !mensagem) {
        throw new HttpError('Campos obrigatórios: email_contato, tipo, mensagem');
    }
    const { lastID } = await db.run(`INSERT INTO comunicacao_site (email_contato, tipo, mensagem) VALUES (?, ?, ?)`, [email_contato, tipo, mensagem]);
    return await readById(lastID);
}
async function remove(id) {
    const db = await Database.connect();
    const { changes } = await db.run(`DELETE FROM comunicacao_site WHERE id_comunicacao = ?`, [id]);
    if (changes === 1)
        return true;
    throw new HttpError('Contato não encontrado', 404);
}
export default { readAll, readById, create, remove };
