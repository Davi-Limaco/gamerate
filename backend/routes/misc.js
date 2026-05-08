const router    = require('express').Router();
const MiscModel = require('../models/MiscModel');
const { authRequired, requirePerfil } = require('../middleware/auth');
const { interpretarErroPG } = require('../middleware/errorHandler');

// POST /api/contato
router.post('/contato', async (req, res) => {
  const { email_contato, tipo, mensagem } = req.body;

  // Validações de entrada
  if (!email_contato || !tipo || !mensagem)
    return res.status(400).json({ erro: 'Preencha todos os campos' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_contato))
    return res.status(400).json({ erro: 'E-mail de contato inválido' });
  if (!['Dúvida','Denúncia','Erro','Sugestão'].includes(tipo))
    return res.status(400).json({ erro: 'Tipo deve ser: Dúvida, Denúncia, Erro ou Sugestão' });
  if (mensagem.trim().length < 10)
    return res.status(400).json({ erro: 'Mensagem deve ter no mínimo 10 caracteres' });

  try {
    await MiscModel.criarContato({ email_contato, tipo, mensagem });
    res.status(201).json({ mensagem: 'Mensagem enviada com sucesso' });
  } catch (err) {
    console.error('contato error:', err.message);
    const { status, mensagem: msg } = interpretarErroPG(err);
    res.status(status).json({ erro: msg });
  }
});

// GET /api/contato — admin
router.get('/contato', authRequired, requirePerfil('Administrador'), async (req, res) => {
  try {
    res.json(await MiscModel.listarContatos());
  } catch (err) {
    console.error('listar contatos error:', err.message);
    const { status, mensagem } = interpretarErroPG(err);
    res.status(status).json({ erro: mensagem });
  }
});

// GET /api/generos
router.get('/generos', async (req, res) => {
  try {
    res.json(await MiscModel.listarGeneros());
  } catch (err) {
    console.error('generos error:', err.message);
    const { status, mensagem } = interpretarErroPG(err);
    res.status(status).json({ erro: mensagem });
  }
});

// GET /api/plataformas
router.get('/plataformas', async (req, res) => {
  try {
    res.json(await MiscModel.listarPlataformas());
  } catch (err) {
    console.error('plataformas error:', err.message);
    const { status, mensagem } = interpretarErroPG(err);
    res.status(status).json({ erro: mensagem });
  }
});

module.exports = router;
