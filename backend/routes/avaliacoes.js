const router         = require('express').Router();
const AvaliacaoModel = require('../models/AvaliacaoModel');
const { authRequired } = require('../middleware/auth');

// GET /api/avaliacoes/destaque
router.get('/destaque', async (req, res) => {
  try {
    res.json(await AvaliacaoModel.destaque());
  } catch (err) {
    console.error('destaque error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/avaliacoes
router.get('/', async (req, res) => {
  try {
    res.json(await AvaliacaoModel.listar(req.query));
  } catch (err) {
    console.error('listagem aval error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/avaliacoes/:id
router.get('/:id', async (req, res) => {
  try {
    const aval = await AvaliacaoModel.buscarPorId(req.params.id);
    if (!aval) return res.status(404).json({ erro: 'Avaliação não encontrada' });
    res.json(aval);
  } catch (err) {
    console.error('detalhe aval error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/avaliacoes
router.post('/', authRequired, async (req, res) => {
  const { id_jogo_fk, nota, titulo, texto } = req.body;
  if (!id_jogo_fk || nota == null || !titulo || !texto)
    return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos' });
  if (texto.length < 40)
    return res.status(400).json({ erro: 'Texto deve ter no mínimo 40 caracteres' });
  try {
    if (await AvaliacaoModel.jaAvaliou(req.usuario.id, id_jogo_fk))
      return res.status(409).json({ erro: 'Você já avaliou este jogo' });
    const id = await AvaliacaoModel.criar({ id_usuario_fk: req.usuario.id, id_jogo_fk, nota, titulo, texto });
    res.status(201).json({ id_avaliacao: id });
  } catch (err) {
    console.error('criar aval error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// PUT /api/avaliacoes/:id
router.put('/:id', authRequired, async (req, res) => {
  try {
    const aval = await AvaliacaoModel.buscarPorId(req.params.id);
    if (!aval) return res.status(404).json({ erro: 'Avaliação não encontrada' });
    if (aval.id_usuario_fk !== req.usuario.id && req.usuario.perfil !== 'Administrador')
      return res.status(403).json({ erro: 'Sem permissão' });
    await AvaliacaoModel.atualizar(req.params.id, req.body);
    res.json({ mensagem: 'Avaliação atualizada' });
  } catch (err) {
    console.error('atualizar aval error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// DELETE /api/avaliacoes/:id
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const aval = await AvaliacaoModel.buscarPorId(req.params.id);
    if (!aval) return res.status(404).json({ erro: 'Avaliação não encontrada' });
    if (aval.id_usuario_fk !== req.usuario.id && req.usuario.perfil !== 'Administrador')
      return res.status(403).json({ erro: 'Sem permissão' });
    await AvaliacaoModel.excluir(req.params.id, aval.id_jogo_fk);
    res.json({ mensagem: 'Avaliação excluída' });
  } catch (err) {
    console.error('excluir aval error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/avaliacoes/:id/curtir
router.post('/:id/curtir', authRequired, async (req, res) => {
  try {
    const curtiu = await AvaliacaoModel.toggleCurtida(req.params.id, req.usuario.id);
    res.json({ curtiu });
  } catch (err) {
    console.error('curtir error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/avaliacoes/:id/comentar
router.post('/:id/comentar', authRequired, async (req, res) => {
  const { texto } = req.body;
  if (!texto) return res.status(400).json({ erro: 'Texto obrigatório' });
  try {
    const id = await AvaliacaoModel.comentar(req.params.id, req.usuario.id, texto);
    res.status(201).json({ id_comentario: id });
  } catch (err) {
    console.error('comentar error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
