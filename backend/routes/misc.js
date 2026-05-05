const router    = require('express').Router();
const MiscModel = require('../models/MiscModel');
const { authRequired, requirePerfil } = require('../middleware/auth');

// POST /api/contato
router.post('/contato', async (req, res) => {
  const { email_contato, tipo, mensagem } = req.body;
  if (!email_contato || !tipo || !mensagem)
    return res.status(400).json({ erro: 'Preencha todos os campos' });
  try {
    await MiscModel.criarContato({ email_contato, tipo, mensagem });
    res.status(201).json({ mensagem: 'Mensagem enviada com sucesso' });
  } catch (err) {
    console.error('contato error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/contato — admin
router.get('/contato', authRequired, requirePerfil('Administrador'), async (req, res) => {
  try {
    res.json(await MiscModel.listarContatos());
  } catch (err) {
    console.error('listar contatos error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/generos
router.get('/generos', async (req, res) => {
  try {
    res.json(await MiscModel.listarGeneros());
  } catch (err) {
    console.error('generos error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/plataformas
router.get('/plataformas', async (req, res) => {
  try {
    res.json(await MiscModel.listarPlataformas());
  } catch (err) {
    console.error('plataformas error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
