const express = require('express');
const pool = require('../db/connection');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// GET /api/avaliacoes/destaque
router.get('/destaque', async (req, res) => {
  try {
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
    res.json(r.rows);
  } catch (err) {
    console.error('destaque error:', err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// GET /api/avaliacoes
router.get('/', async (req, res) => {
  const { jogo_id, page = 1, limit = 10, ordem = 'data_publicacao', dir = 'DESC' } = req.query;

  const ordens  = ['data_publicacao','nota','titulo'];
  const dirs    = ['ASC','DESC'];
  const safeOrd = ordens.includes(ordem) ? ordem : 'data_publicacao';
  const safeDir = dirs.includes(dir.toUpperCase()) ? dir.toUpperCase() : 'DESC';
  const offset  = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

  const conditions = ['1=1'];
  const params     = [];
  let idx = 1;

  if (jogo_id) {
    conditions.push(`a.id_jogo_fk = $${idx++}`);
    params.push(jogo_id);
  }

  const where = 'WHERE ' + conditions.join(' AND ');

  try {
    const [rows, cnt] = await Promise.all([
      pool.query(
        `SELECT a.id_avaliacao, a.titulo, a.texto, a.nota, a.data_publicacao,
                u.id_usuario, u.nome_usuario, j.id_jogo, j.nome_jogo,
                (SELECT COUNT(*)::int FROM curtida   c  WHERE c.id_avaliacao_fk  = a.id_avaliacao) AS total_curtidas,
                (SELECT COUNT(*)::int FROM comentario co WHERE co.id_avaliacao_fk = a.id_avaliacao) AS total_comentarios
         FROM avaliacao a
         JOIN usuario u ON u.id_usuario = a.id_usuario_fk
         JOIN jogo    j ON j.id_jogo    = a.id_jogo_fk
         ${where}
         ORDER BY a.${safeOrd} ${safeDir}
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, parseInt(limit), offset]
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM avaliacao a ${where}`, params),
    ]);

    res.json({ avaliacoes: rows.rows, total: cnt.rows[0].total });
  } catch (err) {
    console.error('listagem aval error:', err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// GET /api/avaliacoes/:id
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT a.*, u.nome_usuario, j.nome_jogo, j.capa,
              (SELECT COUNT(*)::int FROM curtida c WHERE c.id_avaliacao_fk = a.id_avaliacao) AS total_curtidas
       FROM avaliacao a
       JOIN usuario u ON u.id_usuario = a.id_usuario_fk
       JOIN jogo    j ON j.id_jogo    = a.id_jogo_fk
       WHERE a.id_avaliacao = $1`,
      [req.params.id]
    );

    if (!r.rows.length) {
      return res.status(404).json({ erro: 'Avaliação não encontrada' });
    }

    const comentarios = await pool.query(
      `SELECT co.id_comentario, co.texto, co.data_comentario, u.id_usuario, u.nome_usuario
       FROM comentario co
       JOIN usuario u ON u.id_usuario = co.id_usuario_fk
       WHERE co.id_avaliacao_fk = $1
       ORDER BY co.data_comentario ASC`,
      [req.params.id]
    );

    res.json({ ...r.rows[0], comentarios: comentarios.rows });
  } catch (err) {
    console.error('detalhe aval error:', err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// POST /api/avaliacoes
router.post('/', authRequired, async (req, res) => {
  const { id_jogo_fk, nota, titulo, texto } = req.body;

  if (!id_jogo_fk || nota == null || !titulo || !texto) {
    return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos' });
  }

  if (texto.length < 40) {
    return res.status(400).json({ erro: 'Texto deve ter no mínimo 40 caracteres' });
  }

  try {
    const existe = await pool.query(
      'SELECT id_avaliacao FROM avaliacao WHERE id_usuario_fk = $1 AND id_jogo_fk = $2',
      [req.usuario.id, id_jogo_fk]
    );

    if (existe.rows.length) {
      return res.status(409).json({ erro: 'Você já avaliou este jogo' });
    }

    const r = await pool.query(
      `INSERT INTO avaliacao (id_usuario_fk, id_jogo_fk, nota, titulo, texto, data_publicacao)
       VALUES ($1,$2,$3,$4,$5,CURRENT_DATE)
       RETURNING id_avaliacao`,
      [req.usuario.id, id_jogo_fk, nota, titulo, texto]
    );

    await pool.query(
      `UPDATE jogo SET
         nota_media       = (SELECT AVG(nota)   FROM avaliacao WHERE id_jogo_fk = $1),
         total_avaliacoes = (SELECT COUNT(*)::int FROM avaliacao WHERE id_jogo_fk = $1)
       WHERE id_jogo = $1`,
      [id_jogo_fk]
    );

    res.status(201).json({ id_avaliacao: r.rows[0].id_avaliacao });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// PUT /api/avaliacoes/:id
router.put('/:id', authRequired, async (req, res) => {
  const { nota, titulo, texto } = req.body;

  try {
    const r = await pool.query(
      'SELECT id_usuario_fk FROM avaliacao WHERE id_avaliacao = $1',
      [req.params.id]
    );

    if (!r.rows.length) {
      return res.status(404).json({ erro: 'Avaliação não encontrada' });
    }

    if (
      r.rows[0].id_usuario_fk !== req.usuario.id &&
      req.usuario.perfil !== 'Administrador'
    ) {
      return res.status(403).json({ erro: 'Sem permissão' });
    }

    await pool.query(
      'UPDATE avaliacao SET nota=$1, titulo=$2, texto=$3 WHERE id_avaliacao=$4',
      [nota, titulo, texto, req.params.id]
    );

    res.json({ mensagem: 'Avaliação atualizada' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// DELETE /api/avaliacoes/:id
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id_usuario_fk, id_jogo_fk FROM avaliacao WHERE id_avaliacao = $1',
      [req.params.id]
    );

    if (!r.rows.length) {
      return res.status(404).json({ erro: 'Avaliação não encontrada' });
    }

    if (
      r.rows[0].id_usuario_fk !== req.usuario.id &&
      req.usuario.perfil !== 'Administrador'
    ) {
      return res.status(403).json({ erro: 'Sem permissão' });
    }

    const jogo_id = r.rows[0].id_jogo_fk;

    await pool.query('DELETE FROM avaliacao WHERE id_avaliacao = $1', [
      req.params.id
    ]);

    await pool.query(
      `UPDATE jogo SET
         nota_media       = (SELECT AVG(nota)    FROM avaliacao WHERE id_jogo_fk = $1),
         total_avaliacoes = (SELECT COUNT(*)::int FROM avaliacao WHERE id_jogo_fk = $1)
       WHERE id_jogo = $1`,
      [jogo_id]
    );

    res.json({ mensagem: 'Avaliação excluída' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// POST /api/avaliacoes/:id/curtir
router.post('/:id/curtir', authRequired, async (req, res) => {
  try {
    const ja = await pool.query(
      'SELECT 1 FROM curtida WHERE id_avaliacao_fk=$1 AND id_usuario_fk=$2',
      [req.params.id, req.usuario.id]
    );

    if (ja.rows.length) {
      await pool.query(
        'DELETE FROM curtida WHERE id_avaliacao_fk=$1 AND id_usuario_fk=$2',
        [req.params.id, req.usuario.id]
      );
      return res.json({ curtiu: false });
    }

    await pool.query(
      'INSERT INTO curtida (id_avaliacao_fk, id_usuario_fk, data_curtida) VALUES ($1,$2,CURRENT_DATE)',
      [req.params.id, req.usuario.id]
    );

    res.json({ curtiu: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// POST /api/avaliacoes/:id/comentar
router.post('/:id/comentar', authRequired, async (req, res) => {
  const { texto } = req.body;

  if (!texto) {
    return res.status(400).json({ erro: 'Texto obrigatório' });
  }

  try {
    const r = await pool.query(
      `INSERT INTO comentario (id_avaliacao_fk, id_usuario_fk, texto, data_comentario)
       VALUES ($1,$2,$3,CURRENT_DATE)
       RETURNING id_comentario`,
      [req.params.id, req.usuario.id, texto]
    );

    res.status(201).json({ id_comentario: r.rows[0].id_comentario });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;