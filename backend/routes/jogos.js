const router    = require('express').Router();
const JogoModel = require('../models/JogoModel');
const { authRequired, requirePerfil } = require('../middleware/auth');
const { interpretarErroPG } = require('../middleware/errorHandler');

// GET /api/jogos/stats
router.get('/stats', async (req, res) => {
  try {
    res.json(await JogoModel.stats());
  } catch (err) {
    console.error('stats error:', err.message);
    const { status, mensagem } = interpretarErroPG(err);
    res.status(status).json({ erro: mensagem });
  }
});

// GET /api/jogos/destaques
router.get('/destaques', async (req, res) => {
  try {
    res.json(await JogoModel.destaques());
  } catch (err) {
    console.error('destaques error:', err.message);
    const { status, mensagem } = interpretarErroPG(err);
    res.status(status).json({ erro: mensagem });
  }
});

// GET /api/jogos
router.get('/', async (req, res) => {
  try {
    res.json(await JogoModel.listar(req.query));
  } catch (err) {
    console.error('listagem error:', err.message);
    const { status, mensagem } = interpretarErroPG(err);
    res.status(status).json({ erro: mensagem });
  }
});

// GET /api/jogos/:id
router.get('/:id', async (req, res) => {
  if (isNaN(parseInt(req.params.id)))
    return res.status(400).json({ erro: 'ID inválido' });
  try {
    const jogo = await JogoModel.buscarPorId(req.params.id);
    if (!jogo) return res.status(404).json({ erro: 'Jogo não encontrado' });
    res.json(jogo);
  } catch (err) {
    console.error('detalhe error:', err.message);
    const { status, mensagem } = interpretarErroPG(err);
    res.status(status).json({ erro: mensagem });
  }
});

// POST /api/jogos — admin
router.post('/', authRequired, requirePerfil('Administrador'), async (req, res) => {
  const { nome_jogo, desenvolvedora, data_lancamento, descricao, capa, generos, plataformas } = req.body;

  // Validação antes do banco
  if (!nome_jogo || !desenvolvedora || !data_lancamento || !descricao)
    return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos' });
  if (nome_jogo.trim().length === 0)
    return res.status(400).json({ erro: 'Nome do jogo não pode ser vazio' });
  if (descricao.trim().length < 10)
    return res.status(400).json({ erro: 'Descrição deve ter no mínimo 10 caracteres' });

  try {
    const id = await JogoModel.criar({ nome_jogo, desenvolvedora, data_lancamento, descricao, capa, generos, plataformas });
    res.status(201).json({ id_jogo: id });
  } catch (err) {
    console.error('criar jogo error:', err.message);
    const { status, mensagem } = interpretarErroPG(err);
    res.status(status).json({ erro: mensagem });
  }
});

// PUT /api/jogos/:id — admin
router.put('/:id', authRequired, requirePerfil('Administrador'), async (req, res) => {
  if (isNaN(parseInt(req.params.id)))
    return res.status(400).json({ erro: 'ID inválido' });
  try {
    await JogoModel.atualizar(req.params.id, req.body);
    res.json({ mensagem: 'Jogo atualizado' });
  } catch (err) {
    console.error('atualizar jogo error:', err.message);
    const { status, mensagem } = interpretarErroPG(err);
    res.status(status).json({ erro: mensagem });
  }
});

// DELETE /api/jogos/:id — admin
router.delete('/:id', authRequired, requirePerfil('Administrador'), async (req, res) => {
  if (isNaN(parseInt(req.params.id)))
    return res.status(400).json({ erro: 'ID inválido' });
  try {
    await JogoModel.excluir(req.params.id);
    res.json({ mensagem: 'Jogo excluído' });
  } catch (err) {
    console.error('excluir jogo error:', err.message);
    // Erro de negócio lançado pelo model tem prioridade
    if (err.message.includes('avaliações'))
      return res.status(409).json({ erro: err.message });
    const { status, mensagem } = interpretarErroPG(err);
    res.status(status).json({ erro: mensagem });
  }
});

module.exports = router;
