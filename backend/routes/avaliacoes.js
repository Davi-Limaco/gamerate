const router = require('express').Router();
const pool   = require('../db/connection');
const { authRequired } = require('../middleware/auth');

router.get('/destaque', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.id_avaliacao, a.titulo, a.texto, a.nota, a.data_publicacao,
              u.id_usuario, u.nome_usuario,
              j.id_jogo, j.nome_jogo, j.capa,
              COUNT(c.id_avaliacao_fk) AS total_curtidas
       FROM avaliacao a
       JOIN usuario u ON u.id_usuario = a.id_usuario_fk
       JOIN jogo    j ON j.id_jogo    = a.id_jogo_fk
       LEFT JOIN curtida c ON c.id_avaliacao_fk = a.id_avaliacao
       GROUP BY a.id_avaliacao
       ORDER BY total_curtidas DESC
       LIMIT 4`
    );
    res.json(rows);
  } catch (err) {
    console.error('destaque error:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.get('/', async (req, res) => {
  const { jogo_id, page = 1, limit = 10, ordem = 'data_publicacao', dir = 'DESC' } = req.query;
  const ordens  = ['data_publicacao','nota','titulo'];
  const dirs    = ['ASC','DESC'];
  const safeOrd = ordens.includes(ordem) ? ordem : 'data_publicacao';
  const safeDir = dirs.includes(dir.toUpperCase()) ? dir.toUpperCase() : 'DESC';
  const offset  = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

  let where  = 'WHERE 1=1';
  const params = [];
  if (jogo_id) { where += ' AND a.id_jogo_fk = ?'; params.push(jogo_id); }

  try {
    const [rows] = await pool.query(
      `SELECT a.id_avaliacao, a.titulo, a.texto, a.nota, a.data_publicacao,
              u.id_usuario, u.nome_usuario,
              j.id_jogo, j.nome_jogo,
              (SELECT COUNT(*) FROM curtida   c  WHERE c.id_avaliacao_fk  = a.id_avaliacao) AS total_curtidas,
              (SELECT COUNT(*) FROM comentario co WHERE co.id_avaliacao_fk = a.id_avaliacao) AS total_comentarios
       FROM avaliacao a
       JOIN usuario u ON u.id_usuario = a.id_usuario_fk
       JOIN jogo    j ON j.id_jogo    = a.id_jogo_fk
       ${where}
       ORDER BY a.${safeOrd} ${safeDir}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM avaliacao a ${where}`, params
    );

    res.json({ avaliacoes: rows, total });
  } catch (err) {
    console.error('listagem aval error:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [[aval]] = await pool.query(
      `SELECT a.*, u.nome_usuario, j.nome_jogo, j.capa,
              (SELECT COUNT(*) FROM curtida c WHERE c.id_avaliacao_fk = a.id_avaliacao) AS total_curtidas
       FROM avaliacao a
       JOIN usuario u ON u.id_usuario = a.id_usuario_fk
       JOIN jogo    j ON j.id_jogo    = a.id_jogo_fk
       WHERE a.id_avaliacao = ?`, [req.params.id]
    );
    if (!aval) return res.status(404).json({ erro: 'Avaliação não encontrada' });

    const [comentarios] = await pool.query(
      `SELECT co.id_comentario, co.texto, co.data_comentario,
              u.id_usuario, u.nome_usuario
       FROM comentario co
       JOIN usuario u ON u.id_usuario = co.id_usuario_fk
       WHERE co.id_avaliacao_fk = ?
       ORDER BY co.data_comentario ASC`, [req.params.id]
    );

    res.json({ ...aval, comentarios });
  } catch (err) {
    console.error('detalhe aval error:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.post('/', authRequired, async (req, res) => {
  const { id_jogo_fk, nota, titulo, texto } = req.body;
  if (!id_jogo_fk || nota == null || !titulo || !texto)
    return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos' });
  if (texto.length < 40)
    return res.status(400).json({ erro: 'Texto deve ter no mínimo 40 caracteres' });

  try {
    const [[existe]] = await pool.query(
      'SELECT id_avaliacao FROM avaliacao WHERE id_usuario_fk = ? AND id_jogo_fk = ?',
      [req.usuario.id, id_jogo_fk]
    );
    if (existe) return res.status(409).json({ erro: 'Você já avaliou este jogo' });

    const [r] = await pool.query(
      `INSERT INTO avaliacao (id_usuario_fk, id_jogo_fk, nota, titulo, texto, data_publicacao)
       VALUES (?, ?, ?, ?, ?, CURDATE())`,
      [req.usuario.id, id_jogo_fk, nota, titulo, texto]
    );

    await pool.query(
      `UPDATE jogo SET
         nota_media       = (SELECT AVG(nota)  FROM avaliacao WHERE id_jogo_fk = ?),
         total_avaliacoes = (SELECT COUNT(*)   FROM avaliacao WHERE id_jogo_fk = ?)
       WHERE id_jogo = ?`,
      [id_jogo_fk, id_jogo_fk, id_jogo_fk]
    );

    res.status(201).json({ id_avaliacao: r.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.put('/:id', authRequired, async (req, res) => {
  const { nota, titulo, texto } = req.body;
  try {
    const [[aval]] = await pool.query(
      'SELECT id_usuario_fk FROM avaliacao WHERE id_avaliacao = ?', [req.params.id]
    );
    if (!aval) return res.status(404).json({ erro: 'Avaliação não encontrada' });
    if (aval.id_usuario_fk !== req.usuario.id && req.usuario.perfil !== 'Administrador')
      return res.status(403).json({ erro: 'Sem permissão' });

    await pool.query(
      'UPDATE avaliacao SET nota=?, titulo=?, texto=? WHERE id_avaliacao=?',
      [nota, titulo, texto, req.params.id]
    );
    res.json({ mensagem: 'Avaliação atualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.delete('/:id', authRequired, async (req, res) => {
  try {
    const [[aval]] = await pool.query(
      'SELECT id_usuario_fk, id_jogo_fk FROM avaliacao WHERE id_avaliacao = ?', [req.params.id]
    );
    if (!aval) return res.status(404).json({ erro: 'Avaliação não encontrada' });
    if (aval.id_usuario_fk !== req.usuario.id && req.usuario.perfil !== 'Administrador')
      return res.status(403).json({ erro: 'Sem permissão' });

    const jogo_id = aval.id_jogo_fk;
    await pool.query('DELETE FROM curtida    WHERE id_avaliacao_fk = ?', [req.params.id]);
    await pool.query('DELETE FROM comentario WHERE id_avaliacao_fk = ?', [req.params.id]);
    await pool.query('DELETE FROM avaliacao  WHERE id_avaliacao = ?',    [req.params.id]);

    await pool.query(
      `UPDATE jogo SET
         nota_media       = (SELECT AVG(nota)  FROM avaliacao WHERE id_jogo_fk = ?),
         total_avaliacoes = (SELECT COUNT(*)   FROM avaliacao WHERE id_jogo_fk = ?)
       WHERE id_jogo = ?`,
      [jogo_id, jogo_id, jogo_id]
    );

    res.json({ mensagem: 'Avaliação excluída' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.post('/:id/curtir', authRequired, async (req, res) => {
  try {
    const [[ja]] = await pool.query(
      'SELECT * FROM curtida WHERE id_avaliacao_fk=? AND id_usuario_fk=?',
      [req.params.id, req.usuario.id]
    );
    if (ja) {
      await pool.query(
        'DELETE FROM curtida WHERE id_avaliacao_fk=? AND id_usuario_fk=?',
        [req.params.id, req.usuario.id]
      );
      return res.json({ curtiu: false });
    }
    await pool.query(
      'INSERT INTO curtida (id_avaliacao_fk, id_usuario_fk, data_curtida) VALUES (?,?,CURDATE())',
      [req.params.id, req.usuario.id]
    );
    res.json({ curtiu: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.post('/:id/comentar', authRequired, async (req, res) => {
  const { texto } = req.body;
  if (!texto) return res.status(400).json({ erro: 'Texto obrigatório' });
  try {
    const [r] = await pool.query(
      `INSERT INTO comentario (id_avaliacao_fk, id_usuario_fk, texto, data_comentario)
       VALUES (?,?,?,CURDATE())`,
      [req.params.id, req.usuario.id, texto]
    );
    res.status(201).json({ id_comentario: r.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
