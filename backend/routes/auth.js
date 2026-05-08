const router       = require('express').Router();
const jwt          = require('jsonwebtoken');
const bcrypt       = require('bcryptjs');
const UsuarioModel = require('../models/UsuarioModel');
const { interpretarErroPG } = require('../middleware/errorHandler');

// POST /api/auth/cadastro
router.post('/cadastro', async (req, res) => {
  const { nome_usuario, email, senha } = req.body;

  // Validação de entrada antes de chegar no banco
  if (!nome_usuario || !email || !senha)
    return res.status(400).json({ erro: 'Preencha todos os campos' });
  if (nome_usuario.trim().length < 3)
    return res.status(400).json({ erro: 'Nome deve ter no mínimo 3 caracteres' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ erro: 'E-mail inválido' });
  if (senha.length < 6)
    return res.status(400).json({ erro: 'Senha deve ter no mínimo 6 caracteres' });

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
    const { status, mensagem } = interpretarErroPG(err);
    res.status(status).json({ erro: mensagem });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha)
    return res.status(400).json({ erro: 'Preencha todos os campos' });

  try {
    const user = await UsuarioModel.buscarPorEmail(email);
    // Mensagem genérica para não revelar se o email existe
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
    const { status, mensagem } = interpretarErroPG(err);
    res.status(status).json({ erro: mensagem });
  }
});

module.exports = router;
