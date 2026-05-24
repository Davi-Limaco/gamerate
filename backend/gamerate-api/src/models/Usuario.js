import Database from '../database/database.js';

async function readAll() {
  const db = await Database.connect();

  const sql = `
    SELECT u.id_usuario, u.nome_usuario, u.email, u.data_criacao,
           p.nome_perfil
    FROM usuario u
    JOIN perfil p ON p.id_perfil = u.id_perfil_fk
    ORDER BY u.id_usuario
  `;

  return await db.all(sql);
}

async function readById(id) {
  const db = await Database.connect();

  const sql = `
    SELECT u.id_usuario, u.nome_usuario, u.email, u.data_criacao,
           p.nome_perfil,
           (SELECT COUNT(*) FROM avaliacao a WHERE a.id_usuario_fk = u.id_usuario) AS total_avaliacoes
    FROM usuario u
    JOIN perfil p ON p.id_perfil = u.id_perfil_fk
    WHERE u.id_usuario = ?
  `;

  const usuario = await db.get(sql, [id]);

  if (usuario) return usuario;

  throw new Error('Usuario nao encontrado');
}

async function readByEmail(email) {
  const db = await Database.connect();

  const sql = `
    SELECT u.id_usuario, u.nome_usuario, u.email, u.senha,
           p.nome_perfil
    FROM usuario u
    JOIN perfil p ON p.id_perfil = u.id_perfil_fk
    WHERE u.email = ?
  `;

  return await db.get(sql, [email]);
}

async function create({ nome_usuario, email, senha, id_perfil_fk = 1 }) {
  const db = await Database.connect();

  if (nome_usuario && email && senha) {
    const sql = `
      INSERT INTO usuario (nome_usuario, email, senha, id_perfil_fk)
      VALUES (?, ?, ?, ?)
    `;

    const { lastID } = await db.run(sql, [nome_usuario, email, senha, id_perfil_fk]);

    return await readById(lastID);
  } else {
    throw new Error('Unable to create usuario');
  }
}

async function update({ id, nome_usuario, email, senha }) {
  const db = await Database.connect();

  const fields = [];
  const params = [];

  if (nome_usuario) { fields.push('nome_usuario = ?'); params.push(nome_usuario); }
  if (email)        { fields.push('email = ?');        params.push(email); }
  if (senha)        { fields.push('senha = ?');        params.push(senha); }

  if (fields.length === 0) throw new Error('Nenhum campo para atualizar');

  params.push(id);

  const sql = `UPDATE usuario SET ${fields.join(', ')} WHERE id_usuario = ?`;

  const { changes } = await db.run(sql, params);

  if (changes === 1) return readById(id);

  throw new Error('Usuario nao encontrado');
}

async function updatePerfil({ id, id_perfil_fk }) {
  const db = await Database.connect();

  const sql = `UPDATE usuario SET id_perfil_fk = ? WHERE id_usuario = ?`;

  const { changes } = await db.run(sql, [id_perfil_fk, id]);

  if (changes === 1) return readById(id);

  throw new Error('Usuario nao encontrado');
}

async function remove(id) {
  const db = await Database.connect();

  const { changes } = await db.run(`DELETE FROM usuario WHERE id_usuario = ?`, [id]);

  if (changes === 1) return true;

  throw new Error('Usuario nao encontrado');
}

async function readAvaliacoes(id) {
  const db = await Database.connect();

  const sql = `
    SELECT a.id_avaliacao, a.titulo, a.nota, a.data_publicacao,
           j.id_jogo, j.nome_jogo, j.capa
    FROM avaliacao a
    JOIN jogo j ON j.id_jogo = a.id_jogo_fk
    WHERE a.id_usuario_fk = ?
    ORDER BY a.data_publicacao DESC
  `;

  return await db.all(sql, [id]);
}

async function readNotificacoes(id) {
  const db = await Database.connect();

  const sql = `
    SELECT n.id_notificacao, n.titulo, n.mensagem, n.data_envio,
           nu.lido, nu.data_visualizacao
    FROM notificacao n
    JOIN notificacao_usuario nu ON nu.id_notificacao_fk = n.id_notificacao
    WHERE nu.id_usuario_fk = ?
    ORDER BY n.data_envio DESC
  `;

  return await db.all(sql, [id]);
}

async function toggleSeguir(id_seguidor_fk, id_usuario_fk) {
  const db = await Database.connect();

  const ja = await db.get(
    `SELECT 1 FROM usuario_seguidor WHERE id_seguidor_fk = ? AND id_usuario_fk = ?`,
    [id_seguidor_fk, id_usuario_fk]
  );

  if (ja) {
    await db.run(
      `DELETE FROM usuario_seguidor WHERE id_seguidor_fk = ? AND id_usuario_fk = ?`,
      [id_seguidor_fk, id_usuario_fk]
    );
    return false;
  }

  await db.run(
    `INSERT INTO usuario_seguidor (id_seguidor_fk, id_usuario_fk) VALUES (?, ?)`,
    [id_seguidor_fk, id_usuario_fk]
  );
  return true;
}

export default {
  readAll, readById, readByEmail,
  create, update, updatePerfil, remove,
  readAvaliacoes, readNotificacoes, toggleSeguir,
};
