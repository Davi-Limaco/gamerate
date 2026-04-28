import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db/connection.js';
import { authRequired, requirePerfil } from '../middleware/auth.js';

const router = express.Router();

// GET /api/usuarios/me
router.get('/me', authRequired, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT u.id_usuario, u.nome_usuario, u.email, u.data_criacao, p.nome_perfil
       FROM usuario u
       JOIN perfil p ON p.id_perfil = u.id_perfil_fk
       WHERE u.id_usuario = $1`,
      [req.usuario.id]
    );

    if (!r.rows.length) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    const [aval, seg, seguindo] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total FROM avaliacao WHERE id_usuario_fk = $1', [req.usuario.id]),
      pool.query('SELECT COUNT(*)::int AS total FROM usuario_seguidor WHERE id_usuario_fk = $1', [req.usuario.id]),
      pool.query('SELECT COUNT(*)::int AS total FROM usuario_seguidor WHERE id_seguidor_fk = $1', [req.usuario.id]),
    ]);

    res.json({
      ...r.rows[0],
      total_avaliacoes: aval.rows[0].total,
      total_seguidores: seg.rows[0].total,
      total_seguindo: seguindo.rows[0].total,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// PUT /api/usuarios/me
router.put('/me', authRequired, async (req, res) => {
  const { nome_usuario, email, senha } = req.body;

  try {
    if (email) {
      const existe = await pool.query(
        'SELECT id_usuario FROM usuario WHERE email = $1 AND id_usuario != $2',
        [email, req.usuario.id]
      );

      if (existe.rows.length) {
        return res.status(409).json({ erro: 'E-mail já utilizado' });
      }
    }

    const fields = [];
    const params = [];
    let idx = 1;

    if (nome_usuario) {
      fields.push(`nome_usuario = $${idx++}`);
      params.push(nome_usuario);
    }

    if (email) {
      fields.push(`email = $${idx++}`);
      params.push(email);
    }

    if (senha) {
      const hash = await bcrypt.hash(senha, 10);
      fields.push(`senha = $${idx++}`);
      params.push(hash);
    }

    if (!fields.length) {
      return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
    }

    params.push(req.usuario.id);

    await pool.query(
      `UPDATE usuario SET ${fields.join(', ')} WHERE id_usuario = $${idx}`,
      params
    );

    res.json({ mensagem: 'Perfil atualizado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// GET /api/usuarios/me/avaliacoes
router.get('/me/avaliacoes', authRequired, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT a.id_avaliacao, a.titulo, a.nota, a.data_publicacao,
              j.id_jogo, j.nome_jogo, j.capa,
              (SELECT COUNT(*)::int FROM curtida c WHERE c.id_avaliacao_fk = a.id_avaliacao) AS total_curtidas
       FROM avaliacao a
       JOIN jogo j ON j.id_jogo = a.id_jogo_fk
       WHERE a.id_usuario_fk = $1
       ORDER BY a.data_publicacao DESC`,
      [req.usuario.id]
    );

    res.json(r.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// GET /api/usuarios/me/notificacoes
router.get('/me/notificacoes', authRequired, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT n.id_notificacao, n.titulo, n.mensagem, n.data_envio,
              nu.lido, nu.data_visualizacao
       FROM notificacao n
       JOIN notificacao_usuario nu ON nu.id_notificacao_fk = n.id_notificacao
       WHERE nu.id_usuario_fk = $1
       ORDER BY n.data_envio DESC
       LIMIT 30`,
      [req.usuario.id]
    );

    res.json(r.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// POST /api/usuarios/:id/seguir
router.post('/:id/seguir', authRequired, async (req, res) => {
  const alvo = parseInt(req.params.id);

  if (alvo === req.usuario.id) {
    return res.status(400).json({ erro: 'Você não pode seguir a si mesmo' });
  }

  try {
    const ja = await pool.query(
      'SELECT 1 FROM usuario_seguidor WHERE id_seguidor_fk=$1 AND id_usuario_fk=$2',
      [req.usuario.id, alvo]
    );

    if (ja.rows.length) {
      await pool.query(
        'DELETE FROM usuario_seguidor WHERE id_seguidor_fk=$1 AND id_usuario_fk=$2',
        [req.usuario.id, alvo]
      );

      return res.json({ seguindo: false });
    }

    await pool.query(
      'INSERT INTO usuario_seguidor (id_seguidor_fk, id_usuario_fk, data_inicio) VALUES ($1,$2,CURRENT_DATE)',
      [req.usuario.id, alvo]
    );

    res.json({ seguindo: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// GET /api/usuarios — admin
router.get('/', authRequired, requirePerfil('Administrador'), async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT u.id_usuario, u.nome_usuario, u.email, u.data_criacao, p.nome_perfil
       FROM usuario u
       JOIN perfil p ON p.id_perfil = u.id_perfil_fk
       ORDER BY u.data_criacao DESC`
    );

    res.json(r.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// PUT /api/usuarios/:id/perfil — admin
router.put('/:id/perfil', authRequired, requirePerfil('Administrador'), async (req, res) => {
  const { id_perfil_fk } = req.body;

  try {
    await pool.query(
      'UPDATE usuario SET id_perfil_fk=$1 WHERE id_usuario=$2',
      [id_perfil_fk, req.params.id]
    );

    res.json({ mensagem: 'Perfil atualizado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// DELETE /api/usuarios/:id — admin
router.delete('/:id', authRequired, requirePerfil('Administrador'), async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM usuario WHERE id_usuario=$1',
      [req.params.id]
    );

    res.json({ mensagem: 'Usuário excluído' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

export default router;