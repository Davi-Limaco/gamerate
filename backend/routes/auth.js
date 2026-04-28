import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/connection.js';

const router = express.Router();

// POST /api/auth/cadastro
router.post('/cadastro', async (req, res) => {
  const { nome_usuario, email, senha } = req.body;

  if (!nome_usuario || !email || !senha) {
    return res.status(400).json({ erro: 'Preencha todos os campos' });
  }

  try {
    const existe = await pool.query(
      'SELECT id_usuario FROM usuario WHERE email = $1',
      [email]
    );

    if (existe.rows.length) {
      return res.status(409).json({ erro: 'E-mail já cadastrado' });
    }

    const hash = await bcrypt.hash(senha, 10);

    const r = await pool.query(
      `INSERT INTO usuario (nome_usuario, email, senha, id_perfil_fk, data_criacao)
       VALUES ($1, $2, $3, 1, CURRENT_DATE)
       RETURNING id_usuario`,
      [nome_usuario, email, hash]
    );

    const token = jwt.sign(
      {
        id: r.rows[0].id_usuario,
        nome: nome_usuario,
        perfil: 'Jogador'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      nome: nome_usuario,
      perfil: 'Jogador'
    });
  } catch (err) {
    console.error('cadastro error:', err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Preencha todos os campos' });
  }

  try {
    const r = await pool.query(
      `SELECT u.id_usuario, u.nome_usuario, u.senha, p.nome_perfil
       FROM usuario u
       JOIN perfil p ON p.id_perfil = u.id_perfil_fk
       WHERE u.email = $1`,
      [email]
    );

    if (!r.rows.length) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const user = r.rows[0];
    const ok = await bcrypt.compare(senha, user.senha);

    if (!ok) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      {
        id: user.id_usuario,
        nome: user.nome_usuario,
        perfil: user.nome_perfil
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      nome: user.nome_usuario,
      perfil: user.nome_perfil
    });
  } catch (err) {
    console.error('login error:', err.message);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

export default router;