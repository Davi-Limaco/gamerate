import Database from '@/database/database';
import Jogo from '@/models/Jogo';
// Retorna todas as avaliações, com filtro opcional por jogo
async function readAll({ jogo_id } = {}) {
    const db = await Database.connect();
    const where = jogo_id ? 'WHERE a.id_jogo_fk = ?' : '';
    const params = jogo_id ? [jogo_id] : [];
    const sql = `
    SELECT a.id_avaliacao, a.titulo, a.texto, a.nota, a.data_publicacao,
           u.id_usuario, u.nome_usuario,
           j.id_jogo, j.nome_jogo, j.capa
    FROM avaliacao a
    JOIN usuario u ON u.id_usuario = a.id_usuario_fk
    JOIN jogo    j ON j.id_jogo    = a.id_jogo_fk
    ${where}
    ORDER BY a.data_publicacao DESC
  `;
    return await db.all(sql, params);
}
async function readById(id) {
    const db = await Database.connect();
    const avaliacao = await db.get(`
    SELECT a.*,
           u.nome_usuario, j.nome_jogo, j.capa, j.id_jogo
    FROM avaliacao a
    JOIN usuario u ON u.id_usuario = a.id_usuario_fk
    JOIN jogo    j ON j.id_jogo    = a.id_jogo_fk
    WHERE a.id_avaliacao = ?
  `, [id]);
    if (!avaliacao)
        throw new Error('Avaliação não encontrada');
    return avaliacao;
}
// Cria uma nova avaliação
// Body esperado: { id_usuario_fk, id_jogo_fk, nota, titulo, texto }
async function create({ id_usuario_fk, id_jogo_fk, nota, titulo, texto }) {
    const db = await Database.connect();
    if (!id_usuario_fk || !id_jogo_fk || nota === undefined || nota === null || !titulo || !texto) {
        throw new Error('Campos obrigatórios: id_usuario_fk, id_jogo_fk, nota, titulo, texto');
    }
    const notaNum = parseFloat(String(nota));
    if (Number.isNaN(notaNum) || notaNum < 1 || notaNum > 5) {
        throw new Error('A nota deve ser um número entre 1 e 5');
    }
    const jaAvaliou = await db.get(`SELECT 1 FROM avaliacao WHERE id_usuario_fk = ? AND id_jogo_fk = ?`, [id_usuario_fk, id_jogo_fk]);
    if (jaAvaliou) {
        throw new Error('Você já avaliou este jogo. Edite ou exclua sua avaliação existente.');
    }
    const { lastID } = await db.run(`INSERT INTO avaliacao (id_usuario_fk, id_jogo_fk, nota, titulo, texto)
     VALUES (?, ?, ?, ?, ?)`, [id_usuario_fk, id_jogo_fk, notaNum, titulo, texto]);
    await Jogo.atualizarNota(id_jogo_fk);
    return await readById(lastID);
}
async function update({ id, nota, titulo, texto }) {
    const db = await Database.connect();
    if (!id || nota === undefined || nota === null || !titulo || !texto) {
        throw new Error('Campos obrigatórios: nota, titulo, texto');
    }
    const notaNum = parseFloat(String(nota));
    if (Number.isNaN(notaNum) || notaNum < 1 || notaNum > 5) {
        throw new Error('A nota deve ser um número entre 1 e 5');
    }
    const { changes } = await db.run(`UPDATE avaliacao SET nota = ?, titulo = ?, texto = ? WHERE id_avaliacao = ?`, [notaNum, titulo, texto, id]);
    if (changes === 1) {
        const av = await readById(id);
        await Jogo.atualizarNota(av.id_jogo_fk);
        return av;
    }
    throw new Error('Avaliação não encontrada');
}
async function remove(id) {
    const db = await Database.connect();
    const av = await readById(id);
    const { changes } = await db.run(`DELETE FROM avaliacao WHERE id_avaliacao = ?`, [id]);
    if (changes === 1) {
        await Jogo.atualizarNota(av.id_jogo_fk);
        return true;
    }
    throw new Error('Avaliação não encontrada');
}
// Retorna as avaliações em destaque (maior nota, mais recentes)
async function getDestaque() {
    const db = await Database.connect();
    return await db.all(`
    SELECT a.id_avaliacao, a.titulo, a.texto, a.nota, a.data_publicacao,
           u.id_usuario, u.nome_usuario,
           j.id_jogo, j.nome_jogo, j.capa
    FROM avaliacao a
    JOIN usuario u ON u.id_usuario = a.id_usuario_fk
    JOIN jogo    j ON j.id_jogo    = a.id_jogo_fk
    ORDER BY a.nota DESC, a.data_publicacao DESC
    LIMIT 6
  `);
}
export default { readAll, readById, create, update, remove, getDestaque };
