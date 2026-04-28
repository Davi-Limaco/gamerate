import express from 'express';
import pool from '../db/connection.js';
import { authRequired, requirePerfil } from '../middleware/auth.js';

const router = express.Router();

// POST /api/contato
router.post('/contato', async (req, res) => {
  const { email_contato, tipo, mensagem } = req.body;

  if (!email_contato || !tipo || !mensagem) {
    return res.status(400).json({ erro: 'Preencha todos os campos' });
  }

  try {
    await pool.query(
      `INSERT INTO comunicacao_site (email_contato, tipo, mensagem, data_comunicacao)
       VALUES ($1,$2,$3,CURRENT_DATE)`,
      [email_contato, tipo, mensagem]
    );

    res.status(201).json({ mensagem: 'Mensagem enviada com sucesso' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// GET /api/contato — admin
router.get('/contato', authRequired, requirePerfil('Administrador'), async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM comunicacao_site ORDER BY data_comunicacao DESC'
    );

    res.json(r.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// GET /api/generos
router.get('/generos', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT g.id_genero, g.nome_genero, COUNT(jg.id_jogo_fk)::int AS total_jogos
       FROM genero g
       LEFT JOIN jogo_genero jg ON jg.id_genero_fk = g.id_genero
       GROUP BY g.id_genero
       ORDER BY total_jogos DESC`
    );

    res.json(r.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// GET /api/plataformas
router.get('/plataformas', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT p.id_plataforma, p.nome_plataforma, COUNT(jp.id_jogo_fk)::int AS total_jogos
       FROM plataforma p
       LEFT JOIN jogo_plataforma jp ON jp.id_plataforma_fk = p.id_plataforma
       GROUP BY p.id_plataforma
       ORDER BY total_jogos DESC`
    );

    res.json(r.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

export default router;