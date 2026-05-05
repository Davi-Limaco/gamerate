const router       = require('express').Router();
const jwt          = require('jsonwebtoken');
const bcrypt       = require('bcryptjs');
const UsuarioModel = require('../models/UsuarioModel');

// POST /api/auth/cadastro
router.post('/cadastro', async (req, res) => {
  const { nome_usuario, email, senha } = req.body;
  if (!nome_usuario || !email || !senha)
    return res.status(400).json({ erro: 'Preencha todos os campos' });

  try {
    if (await UsuarioModel.emailExiste(email))
      return res.status(409).json({ erro: 'E-mail já cadastrado' });

    const id    = await UsuarioModel.criar({ nome_usuario, email, senha });
    const token = jwt.sign(
      { id, nome: nome_usuario, perfil: 'Jogador' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, nome: nome_usuario, perfil: 'Jogador' });
  } catch (err) {
    console.error('cadastro error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha)
    return res.status(400).json({ erro: 'Preencha todos os campos' });

  try {
    const user = await UsuarioModel.buscarPorEmail(email);
    if (!user) return res.status(401).json({ erro: 'Credenciais inválidas' });

    const ok = await bcrypt.compare(senha, user.senha);
    if (!ok) return res.status(401).json({ erro: 'Credenciais inválidas' });

    const token = jwt.sign(
      { id: user.id_usuario, nome: user.nome_usuario, perfil: user.nome_perfil },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, nome: user.nome_usuario, perfil: user.nome_perfil });
  } catch (err) {
    console.error('login error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
