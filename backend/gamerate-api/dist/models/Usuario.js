import Database from '../database/database.js';
import HttpError from '../errors/HttpError.js';
function mapUsuario(row) {
    return {
        id_usuario: row.id_usuario,
        nome_usuario: row.nome_usuario,
        email: row.email,
        senha: row.senha,
        id_perfil_fk: row.id_perfil_fk ?? 0,
        nome_perfil: row.nome_perfil,
        data_criacao: row.data_criacao,
        total_avaliacoes: row.total_avaliacoes,
    };
}
function mapAvaliacaoResumo(row) {
    return {
        id_avaliacao: row.id_avaliacao,
        id_usuario_fk: row.id_usuario_fk ?? 0,
        id_jogo_fk: row.id_jogo,
        nota: row.nota,
        titulo: row.titulo,
        texto: row.texto ?? '',
        data_publicacao: row.data_publicacao,
        nome_jogo: row.nome_jogo,
        capa: row.capa,
        id_jogo: row.id_jogo,
    };
}
async function readAll() {
    const db = await Database.connect();
    const rows = await db.all(`SELECT u.id_usuario, u.nome_usuario, u.email, u.data_criacao, p.nome_perfil
     FROM usuario u JOIN perfil p ON p.id_perfil = u.id_perfil_fk ORDER BY u.id_usuario`);
    return rows.map(mapUsuario);
}
async function readById(id) {
    const db = await Database.connect();
    const usuario = await db.get(`SELECT u.id_usuario, u.nome_usuario, u.email, u.data_criacao, p.nome_perfil,
            (SELECT COUNT(*) FROM avaliacao a WHERE a.id_usuario_fk = u.id_usuario) AS total_avaliacoes
     FROM usuario u JOIN perfil p ON p.id_perfil = u.id_perfil_fk WHERE u.id_usuario = ?`, [id]);
    if (usuario)
        return mapUsuario(usuario);
    throw new HttpError('Usuário não encontrado', 404);
}
async function readByEmail(email) {
    const db = await Database.connect();
    const usuario = await db.get(`SELECT u.id_usuario, u.nome_usuario, u.email, u.senha, p.nome_perfil
     FROM usuario u JOIN perfil p ON p.id_perfil = u.id_perfil_fk WHERE u.email = ?`, [email]);
    return usuario ? mapUsuario(usuario) : undefined;
}
async function create({ nome_usuario, email, senha, id_perfil_fk = 1 }) {
    const db = await Database.connect();
    if (!nome_usuario || !email || !senha) {
        throw new HttpError('Campos obrigatórios: nome_usuario, email, senha');
    }
    const { lastID } = await db.run(`INSERT INTO usuario (nome_usuario, email, senha, id_perfil_fk) VALUES (?, ?, ?, ?)`, [nome_usuario, email, senha, id_perfil_fk]);
    return await readById(lastID);
}
async function update({ id, nome_usuario, email, senha }) {
    const db = await Database.connect();
    const fields = [];
    const params = [];
    if (nome_usuario) {
        fields.push('nome_usuario = ?');
        params.push(nome_usuario);
    }
    if (email) {
        fields.push('email = ?');
        params.push(email);
    }
    if (senha) {
        fields.push('senha = ?');
        params.push(senha);
    }
    if (fields.length === 0)
        throw new HttpError('Nenhum campo para atualizar');
    params.push(id);
    const { changes } = await db.run(`UPDATE usuario SET ${fields.join(', ')} WHERE id_usuario = ?`, params);
    if (changes === 1)
        return readById(id);
    throw new HttpError('Usuário não encontrado', 404);
}
async function updatePerfil({ id, id_perfil_fk }) {
    const db = await Database.connect();
    if (!id || id_perfil_fk === undefined) {
        throw new HttpError('Os campos id e id_perfil_fk são obrigatórios');
    }
    const { changes } = await db.run(`UPDATE usuario SET id_perfil_fk = ? WHERE id_usuario = ?`, [id_perfil_fk, id]);
    if (changes === 1)
        return readById(id);
    throw new HttpError('Usuário não encontrado', 404);
}
async function remove(id) {
    const db = await Database.connect();
    const { changes } = await db.run(`DELETE FROM usuario WHERE id_usuario = ?`, [id]);
    if (changes === 1)
        return true;
    throw new HttpError('Usuário não encontrado', 404);
}
async function readAvaliacoes(id) {
    const db = await Database.connect();
    const rows = await db.all(`SELECT a.id_avaliacao, a.titulo, a.nota, a.data_publicacao, j.id_jogo, j.nome_jogo, j.capa
     FROM avaliacao a JOIN jogo j ON j.id_jogo = a.id_jogo_fk
     WHERE a.id_usuario_fk = ? ORDER BY a.data_publicacao DESC`, [id]);
    return rows.map(mapAvaliacaoResumo);
}
export default { readAll, readById, readByEmail, create, update, updatePerfil, remove, readAvaliacoes };
