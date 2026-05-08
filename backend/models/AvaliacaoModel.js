const pool = require('../db/connection');

const AvaliacaoModel = {

  async destaque() {
    const r = await pool.query(
      `SELECT a.id_avaliacao, a.titulo, a.texto, a.nota, a.data_publicacao,
              u.id_usuario, u.nome_usuario,
              j.id_jogo, j.nome_jogo, j.capa,
              COUNT(c.id_avaliacao_fk)::int AS total_curtidas
       FROM avaliacao a
       JOIN usuario u ON u.id_usuario = a.id_usuario_fk
       JOIN jogo    j ON j.id_jogo    = a.id_jogo_fk
       LEFT JOIN curtida c ON c.id_avaliacao_fk = a.id_avaliacao
       GROUP BY a.id_avaliacao, u.id_usuario, j.id_jogo
       ORDER BY total_curtidas DESC
       LIMIT 4`
    );
    return r.rows;
  },

  async listar({ jogo_id, page, limit, ordem, dir }) {
    const ordens  = ['data_publicacao', 'nota', 'titulo'];
    const dirs    = ['ASC', 'DESC'];
    const safeOrd = ordens.includes(ordem) ? ordem : 'data_publicacao';
    const safeDir = dirs.includes((dir || '').toUpperCase()) ? dir.toUpperCase() : 'DESC';
    const safePage  = Math.max(1, parseInt(page)  || 1);
    const safeLimit = Math.max(1, parseInt(limit) || 10);
    const offset    = (safePage - 1) * safeLimit;

    const conditions = [];
    const params     = [];
    let   idx        = 1;

    if (jogo_id) { conditions.push(`a.id_jogo_fk = $${idx++}`); params.push(jogo_id); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [rows, cnt] = await Promise.all([
      pool.query(
        `SELECT a.id_avaliacao, a.titulo, a.texto, a.nota, a.data_publicacao,
                u.id_usuario, u.nome_usuario, j.id_jogo, j.nome_jogo,
                (SELECT COUNT(*)::int FROM curtida    c WHERE c.id_avaliacao_fk  = a.id_avaliacao) AS total_curtidas,
                (SELECT COUNT(*)::int FROM comentario c WHERE c.id_avaliacao_fk  = a.id_avaliacao) AS total_comentarios
         FROM avaliacao a
         JOIN usuario u ON u.id_usuario = a.id_usuario_fk
         JOIN jogo    j ON j.id_jogo    = a.id_jogo_fk
         ${where}
         ORDER BY a.${safeOrd} ${safeDir}
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, safeLimit, offset]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total FROM avaliacao a ${where}`,
        params
      ),
    ]);

    return { avaliacoes: rows.rows, total: cnt.rows[0].total };
  },

  async buscarPorId(id) {
    const r = await pool.query(
      `SELECT a.*, u.nome_usuario, j.nome_jogo, j.capa,
              (SELECT COUNT(*)::int FROM curtida c WHERE c.id_avaliacao_fk = a.id_avaliacao) AS total_curtidas
       FROM avaliacao a
       JOIN usuario u ON u.id_usuario = a.id_usuario_fk
       JOIN jogo    j ON j.id_jogo    = a.id_jogo_fk
       WHERE a.id_avaliacao = $1`, [id]
    );
    if (!r.rows.length) return null;

    const comentarios = await pool.query(
      `SELECT co.id_comentario, co.texto, co.data_comentario, u.id_usuario, u.nome_usuario
       FROM comentario co
       JOIN usuario u ON u.id_usuario = co.id_usuario_fk
       WHERE co.id_avaliacao_fk = $1
       ORDER BY co.data_comentario ASC`, [id]
    );

    return { ...r.rows[0], comentarios: comentarios.rows };
  },

  async jaAvaliou(usuarioId, jogoId) {
    const r = await pool.query(
      'SELECT id_avaliacao FROM avaliacao WHERE id_usuario_fk = $1 AND id_jogo_fk = $2',
      [usuarioId, jogoId]
    );
    return r.rows.length > 0;
  },

  async criar({ id_usuario_fk, id_jogo_fk, nota, titulo, texto }) {
    const r = await pool.query(
      `INSERT INTO avaliacao (id_usuario_fk, id_jogo_fk, nota, titulo, texto, data_publicacao)
       VALUES ($1,$2,$3,$4,$5,CURRENT_DATE) RETURNING id_avaliacao`,
      [id_usuario_fk, id_jogo_fk, nota, titulo, texto]
    );
    await this._atualizarNotaJogo(id_jogo_fk);
    return r.rows[0].id_avaliacao;
  },

  async atualizar(id, { nota, titulo, texto }) {
    await pool.query(
      'UPDATE avaliacao SET nota=$1, titulo=$2, texto=$3 WHERE id_avaliacao=$4',
      [nota, titulo, texto, id]
    );
  },

  async excluir(id, jogoId) {
    await pool.query('DELETE FROM avaliacao WHERE id_avaliacao = $1', [id]);
    await this._atualizarNotaJogo(jogoId);
  },

  async toggleCurtida(avaliacaoId, usuarioId) {
    const ja = await pool.query(
      'SELECT 1 FROM curtida WHERE id_avaliacao_fk=$1 AND id_usuario_fk=$2',
      [avaliacaoId, usuarioId]
    );
    if (ja.rows.length) {
      await pool.query(
        'DELETE FROM curtida WHERE id_avaliacao_fk=$1 AND id_usuario_fk=$2',
        [avaliacaoId, usuarioId]
      );
      return false;
    }
    await pool.query(
      'INSERT INTO curtida (id_avaliacao_fk, id_usuario_fk, data_curtida) VALUES ($1,$2,CURRENT_DATE)',
      [avaliacaoId, usuarioId]
    );
    return true;
  },

  async comentar(avaliacaoId, usuarioId, texto) {
    const r = await pool.query(
      `INSERT INTO comentario (id_avaliacao_fk, id_usuario_fk, texto, data_comentario)
       VALUES ($1,$2,$3,CURRENT_DATE) RETURNING id_comentario`,
      [avaliacaoId, usuarioId, texto]
    );
    return r.rows[0].id_comentario;
  },

  async _atualizarNotaJogo(jogoId) {
    await pool.query(
      `UPDATE jogo SET
         nota_media       = (SELECT AVG(nota)    FROM avaliacao WHERE id_jogo_fk = $1),
         total_avaliacoes = (SELECT COUNT(*)::int FROM avaliacao WHERE id_jogo_fk = $1)
       WHERE id_jogo = $1`, [jogoId]
    );
  },

};

module.exports = AvaliacaoModel;
