const router    = require('express').Router();
const JogoModel = require('../models/JogoModel');
const { authRequired, requirePerfil } = require('../middleware/auth');

// GET /api/jogos/stats
router.get('/stats', async (req, res) => {
  try {
    res.json(await JogoModel.stats());
  } catch (err) {
    console.error('stats error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/jogos/destaques
router.get('/destaques', async (req, res) => {
  try {
    res.json(await JogoModel.destaques());
  } catch (err) {
    console.error('destaques error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/jogos
router.get('/', async (req, res) => {
  try {
    const resultado = await JogoModel.listar(req.query);
    res.json(resultado);
  } catch (err) {
    console.error('listagem error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/jogos/:id
router.get('/:id', async (req, res) => {
  try {
    const jogo = await JogoModel.buscarPorId(req.params.id);
    if (!jogo) return res.status(404).json({ erro: 'Jogo não encontrado' });
    res.json(jogo);
  } catch (err) {
    console.error('detalhe error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/jogos — admin
router.post('/', authRequired, requirePerfil('Administrador'), async (req, res) => {
  const { nome_jogo, desenvolvedora, data_lancamento, descricao, capa, generos, plataformas } = req.body;
  if (!nome_jogo || !desenvolvedora || !data_lancamento || !descricao)
    return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos' });
  try {
    const id = await JogoModel.criar({ nome_jogo, desenvolvedora, data_lancamento, descricao, capa, generos, plataformas });
    res.status(201).json({ id_jogo: id });
  } catch (err) {
    console.error('criar jogo error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// PUT /api/jogos/:id — admin
router.put('/:id', authRequired, requirePerfil('Administrador'), async (req, res) => {
  try {
    await JogoModel.atualizar(req.params.id, req.body);
    res.json({ mensagem: 'Jogo atualizado' });
  } catch (err) {
    console.error('atualizar jogo error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// DELETE /api/jogos/:id — admin
router.delete('/:id', authRequired, requirePerfil('Administrador'), async (req, res) => {
  try {
    await JogoModel.excluir(req.params.id);
    res.json({ mensagem: 'Jogo excluído' });
  } catch (err) {
    console.error('excluir jogo error:', err.message);
    const status = err.message.includes('avaliações') ? 409 : 500;
    res.status(status).json({ erro: err.message });
  }
});

module.exports = router;
