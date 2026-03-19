const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool   = require('../db/connection');
const { authRequired, requirePerfil } = require('../middleware/auth');

router.get('/me', authRequired, async (req, res) => {
  try {
    const [[u]] = await pool.query(
      `SELECT u.id_usuario, u.nome_usuario, u.email, u.data_criacao, p.nome_perfil
       FROM usuario u JOIN perfil p ON p.id_perfil = u.id_perfil_fk
       WHERE u.id_usuario = ?`, [req.usuario.id]
    );
    if (!u) return res.status(404).json({ erro: 'Usuário não encontrado' });

    const [[{ total_avaliacoes }]] = await pool.query(
      'SELECT COUNT(*) AS total_avaliacoes FROM avaliacao WHERE id_usuario_fk = ?', [req.usuario.id]
    );
    const [[{ total_seguidores }]] = await pool.query(
      'SELECT COUNT(*) AS total_seguidores FROM usuario_seguidor WHERE id_usuario_fk = ?', [req.usuario.id]
    );
    const [[{ total_seguindo }]] = await pool.query(
      'SELECT COUNT(*) AS total_seguindo FROM usuario_seguidor WHERE id_seguidor_fk = ?', [req.usuario.id]
    );

    res.json({ ...u, total_avaliacoes, total_seguidores, total_seguindo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.put('/me', authRequired, async (req, res) => {
  const { nome_usuario, email, senha } = req.body;
  try {
    if (email) {
      const [[existe]] = await pool.query(
        'SELECT id_usuario FROM usuario WHERE email = ? AND id_usuario != ?',
        [email, req.usuario.id]
      );
      if (existe) return res.status(409).json({ erro: 'E-mail já utilizado' });
    }
    const fields = [];
    const params = [];
    if (nome_usuario) { fields.push('nome_usuario = ?'); params.push(nome_usuario); }
    if (email)        { fields.push('email = ?');        params.push(email); }
    if (senha) {
      const hash = await bcrypt.hash(senha, 10);
      fields.push('senha = ?'); params.push(hash);
    }
    if (!fields.length) return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
    params.push(req.usuario.id);
    await pool.query(`UPDATE usuario SET ${fields.join(', ')} WHERE id_usuario = ?`, params);
    res.json({ mensagem: 'Perfil atualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.get('/me/avaliacoes', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.id_avaliacao, a.titulo, a.nota, a.data_publicacao,
              j.id_jogo, j.nome_jogo, j.capa,
              (SELECT COUNT(*) FROM curtida c WHERE c.id_avaliacao_fk = a.id_avaliacao) AS total_curtidas
       FROM avaliacao a
       JOIN jogo j ON j.id_jogo = a.id_jogo_fk
       WHERE a.id_usuario_fk = ?
       ORDER BY a.data_publicacao DESC`, [req.usuario.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.get('/me/notificacoes', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.id_notificacao, n.titulo, n.mensagem, n.data_envio,
              nu.lido, nu.data_visualizacao
       FROM notificacao n
       JOIN notificacao_usuario nu ON nu.id_notificacao_fk = n.id_notificacao
       WHERE nu.id_usuario_fk = ?
       ORDER BY n.data_envio DESC LIMIT 30`, [req.usuario.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.post('/:id/seguir', authRequired, async (req, res) => {
  const alvo = parseInt(req.params.id);
  if (alvo === req.usuario.id) return res.status(400).json({ erro: 'Você não pode seguir a si mesmo' });
  try {
    const [[ja]] = await pool.query(
      'SELECT * FROM usuario_seguidor WHERE id_seguidor_fk=? AND id_usuario_fk=?',
      [req.usuario.id, alvo]
    );
    if (ja) {
      await pool.query(
        'DELETE FROM usuario_seguidor WHERE id_seguidor_fk=? AND id_usuario_fk=?',
        [req.usuario.id, alvo]
      );
      return res.json({ seguindo: false });
    }
    await pool.query(
      'INSERT INTO usuario_seguidor (id_seguidor_fk, id_usuario_fk, data_inicio) VALUES (?,?,CURDATE())',
      [req.usuario.id, alvo]
    );
    res.json({ seguindo: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.get('/', authRequired, requirePerfil('Administrador'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.nome_usuario, u.email, u.data_criacao, p.nome_perfil
       FROM usuario u JOIN perfil p ON p.id_perfil = u.id_perfil_fk
       ORDER BY u.data_criacao DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.put('/:id/perfil', authRequired, requirePerfil('Administrador'), async (req, res) => {
  const { id_perfil_fk } = req.body;
  try {
    await pool.query('UPDATE usuario SET id_perfil_fk=? WHERE id_usuario=?', [id_perfil_fk, req.params.id]);
    res.json({ mensagem: 'Perfil atualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

router.delete('/:id', authRequired, requirePerfil('Administrador'), async (req, res) => {
  try {
    await pool.query('DELETE FROM usuario WHERE id_usuario=?', [req.params.id]);
    res.json({ mensagem: 'Usuário excluído' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
