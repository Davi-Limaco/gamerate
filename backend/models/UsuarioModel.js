const pool   = require('../db/connection');
const bcrypt = require('bcryptjs');

const UsuarioModel = {

  async buscarPorEmail(email) {
    const r = await pool.query(
      `SELECT u.id_usuario, u.nome_usuario, u.senha, p.nome_perfil
       FROM usuario u
       JOIN perfil p ON p.id_perfil = u.id_perfil_fk
       WHERE u.email = $1`, [email]
    );
    return r.rows[0] || null;
  },

  async emailExiste(email, excluirId = null) {
    const r = await pool.query(
      'SELECT id_usuario FROM usuario WHERE email = $1 AND id_usuario != $2',
      [email, excluirId || 0]
    );
    return r.rows.length > 0;
  },

  async criar({ nome_usuario, email, senha }) {
    const hash = await bcrypt.hash(senha, 10);
    const r = await pool.query(
      `INSERT INTO usuario (nome_usuario, email, senha, id_perfil_fk, data_criacao)
       VALUES ($1, $2, $3, 1, CURRENT_DATE) RETURNING id_usuario`,
      [nome_usuario, email, hash]
    );
    return r.rows[0].id_usuario;
  },

  async buscarPorId(id) {
    const r = await pool.query(
      `SELECT u.id_usuario, u.nome_usuario, u.email, u.data_criacao, p.nome_perfil
       FROM usuario u JOIN perfil p ON p.id_perfil = u.id_perfil_fk
       WHERE u.id_usuario = $1`, [id]
    );
    return r.rows[0] || null;
  },

  async stats(id) {
    const [aval, seg, seguindo] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total FROM avaliacao WHERE id_usuario_fk = $1', [id]),
      pool.query('SELECT COUNT(*)::int AS total FROM usuario_seguidor WHERE id_usuario_fk = $1', [id]),
      pool.query('SELECT COUNT(*)::int AS total FROM usuario_seguidor WHERE id_seguidor_fk = $1', [id]),
    ]);
    return {
      total_avaliacoes: aval.rows[0].total,
      total_seguidores: seg.rows[0].total,
      total_seguindo:   seguindo.rows[0].total,
    };
  },

  async atualizar(id, { nome_usuario, email, senha }) {
    const fields = [];
    const params = [];
    let   idx    = 1;
    if (nome_usuario) { fields.push(`nome_usuario = $${idx++}`); params.push(nome_usuario); }
    if (email)        { fields.push(`email = $${idx++}`);        params.push(email); }
    if (senha) {
      const hash = await bcrypt.hash(senha, 10);
      fields.push(`senha = $${idx++}`); params.push(hash);
    }
    if (!fields.length) throw new Error('Nenhum campo para atualizar');
    params.push(id);
    await pool.query(`UPDATE usuario SET ${fields.join(', ')} WHERE id_usuario = $${idx}`, params);
  },

  async avaliacoes(id) {
    const r = await pool.query(
      `SELECT a.id_avaliacao, a.titulo, a.nota, a.data_publicacao,
              j.id_jogo, j.nome_jogo, j.capa,
              (SELECT COUNT(*)::int FROM curtida c WHERE c.id_avaliacao_fk = a.id_avaliacao) AS total_curtidas
       FROM avaliacao a
       JOIN jogo j ON j.id_jogo = a.id_jogo_fk
       WHERE a.id_usuario_fk = $1
       ORDER BY a.data_publicacao DESC`, [id]
    );
    return r.rows;
  },

  async notificacoes(id) {
    const r = await pool.query(
      `SELECT n.id_notificacao, n.titulo, n.mensagem, n.data_envio,
              nu.lido, nu.data_visualizacao
       FROM notificacao n
       JOIN notificacao_usuario nu ON nu.id_notificacao_fk = n.id_notificacao
       WHERE nu.id_usuario_fk = $1
       ORDER BY n.data_envio DESC LIMIT 30`, [id]
    );
    return r.rows;
  },

  async toggleSeguir(seguidorId, alvoId) {
    const ja = await pool.query(
      'SELECT 1 FROM usuario_seguidor WHERE id_seguidor_fk=$1 AND id_usuario_fk=$2',
      [seguidorId, alvoId]
    );
    if (ja.rows.length) {
      await pool.query(
        'DELETE FROM usuario_seguidor WHERE id_seguidor_fk=$1 AND id_usuario_fk=$2',
        [seguidorId, alvoId]
      );
      return false;
    }
    await pool.query(
      'INSERT INTO usuario_seguidor (id_seguidor_fk, id_usuario_fk, data_inicio) VALUES ($1,$2,CURRENT_DATE)',
      [seguidorId, alvoId]
    );
    return true;
  },

  async listarTodos() {
    const r = await pool.query(
      `SELECT u.id_usuario, u.nome_usuario, u.email, u.data_criacao, p.nome_perfil
       FROM usuario u JOIN perfil p ON p.id_perfil = u.id_perfil_fk
       ORDER BY u.data_criacao DESC`
    );
    return r.rows;
  },

  async atualizarPerfil(id, idPerfilFk) {
    await pool.query('UPDATE usuario SET id_perfil_fk=$1 WHERE id_usuario=$2', [idPerfilFk, id]);
  },

  async excluir(id) {
    await pool.query('DELETE FROM usuario WHERE id_usuario=$1', [id]);
  },

};

module.exports = UsuarioModel;
