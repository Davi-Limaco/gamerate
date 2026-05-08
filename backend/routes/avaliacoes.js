const router         = require('express').Router();
const AvaliacaoModel = require('../models/AvaliacaoModel');
const { authRequired } = require('../middleware/auth');
const { interpretarErroPG } = require('../middleware/errorHandler');

// GET /api/avaliacoes/destaque
router.get('/destaque', async (req, res) => {
  try {
    res.json(await AvaliacaoModel.destaque());
  } catch (err) {
    console.error('destaque error:', err.message);
    const { status, mensagem } = interpretarErroPG(err);
    res.status(status).json({ erro: mensagem });
  }
});

// GET /api/avaliacoes
router.get('/', async (req, res) => {
  try {
    res.json(await AvaliacaoModel.listar(req.query));
  } catch (err) {
    console.error('listagem aval error:', err.message);
    const { status, mensagem } = interpretarErroPG(err);
    res.status(status).json({ erro: mensagem });
  }
});

// GET /api/avaliacoes/:id
router.get('/:id', async (req, res) => {
  if (isNaN(parseInt(req.params.id)))
    return res.status(400).json({ erro: 'ID inválido' });
  try {
    const aval = await AvaliacaoModel.buscarPorId(req.params.id);
    if (!aval) return res.status(404).json({ erro: 'Avaliação não encontrada' });
    res.json(aval);
  } catch (err) {
    console.error('detalhe aval error:', err.message);
    const { status, mensagem } = interpretarErroPG(err);
    res.status(status).json({ erro: mensagem });
  }
});

// POST /api/avaliacoes
router.post('/', authRequired, async (req, res) => {
  const { id_jogo_fk, nota, titulo, texto } = req.body;

  // Validações de entrada
  if (!id_jogo_fk || nota == null || !titulo || !texto)
    return res.status(400).json({ erro: 'Campos obrigatórios não preenchidos' });
  if (isNaN(parseFloat(nota)) || parseFloat(nota) < 1 || parseFloat(nota) > 5)
    return res.status(400).json({ erro: 'Nota deve ser um valor entre 1.0 e 5.0' });
  if (titulo.trim().length < 3)
    return res.status(400).json({ erro: 'Título deve ter no mínimo 3 caracteres' });
  if (texto.trim().length < 40)
    return res.status(400).json({ erro: 'Texto deve ter no mínimo 40 caracteres' });

  try {
    if (await AvaliacaoModel.jaAvaliou(req.usuario.id, id_jogo_fk))
      return res.status(409).json({ erro: 'Você já avaliou este jogo' });

    const id = await AvaliacaoModel.criar({
      id_usuario_fk: req.usuario.id,
      id_jogo_fk, nota, titulo, texto
    });
    res.status(201).json({ id_avaliacao: id });
  } catch (err) {
    console.error('criar aval error:', err.message);
    const { status, mensagem } = interpretarErroPG(err);
    res.status(status).json({ erro: mensagem });
  }
});

// PUT /api/avaliacoes/:id
router.put('/:id', authRequired, async (req, res) => {
  const { nota, titulo, texto } = req.body;

  if (isNaN(parseInt(req.params.id)))
    return res.status(400).json({ erro: 'ID inválido' });
  if (nota != null && (parseFloat(nota) < 1 || parseFloat(nota) > 5))
    return res.status(400).json({ erro: 'Nota deve ser entre 1.0 e 5.0' });
  if (texto && texto.trim().length < 40)
    return res.status(400).json({ erro: 'Texto deve ter no mínimo 40 caracteres' });

  try {
    const aval = await AvaliacaoModel.buscarPorId(req.params.id);
    if (!aval) return res.status(404).json({ erro: 'Avaliação não encontrada' });
    if (aval.id_usuario_fk !== req.usuario.id && req.usuario.perfil !== 'Administrador')
      return res.status(403).json({ erro: 'Sem permissão para editar esta avaliação' });

    await AvaliacaoModel.atualizar(req.params.id, req.body);
    res.json({ mensagem: 'Avaliação atualizada' });
  } catch (err) {
    console.error('atualizar aval error:', err.message);
    const { status, mensagem } = interpretarErroPG(err);
    res.status(status).json({ erro: mensagem });
  }
});

// DELETE /api/avaliacoes/:id
router.delete('/:id', authRequired, async (req, res) => {
  if (isNaN(parseInt(req.params.id)))
    return res.status(400).json({ erro: 'ID inválido' });
  try {
    const aval = await AvaliacaoModel.buscarPorId(req.params.id);
    if (!aval) return res.status(404).json({ erro: 'Avaliação não encontrada' });
    if (aval.id_usuario_fk !== req.usuario.id && req.usuario.perfil !== 'Administrador')
      return res.status(403).json({ erro: 'Sem permissão para excluir esta avaliação' });

    await AvaliacaoModel.excluir(req.params.id, aval.id_jogo_fk);
    res.json({ mensagem: 'Avaliação excluída' });
  } catch (err) {
    console.error('excluir aval error:', err.message);
    const { status, mensagem } = interpretarErroPG(err);
    res.status(status).json({ erro: mensagem });
  }
});

// POST /api/avaliacoes/:id/curtir
router.post('/:id/curtir', authRequired, async (req, res) => {
  if (isNaN(parseInt(req.params.id)))
    return res.status(400).json({ erro: 'ID inválido' });
  try {
    const curtiu = await AvaliacaoModel.toggleCurtida(req.params.id, req.usuario.id);
    res.json({ curtiu });
  } catch (err) {
    console.error('curtir error:', err.message);
    const { status, mensagem } = interpretarErroPG(err);
    res.status(status).json({ erro: mensagem });
  }
});

// POST /api/avaliacoes/:id/comentar
router.post('/:id/comentar', authRequired, async (req, res) => {
  const { texto } = req.body;

  if (!texto || texto.trim().length === 0)
    return res.status(400).json({ erro: 'Comentário não pode ser vazio' });
  if (texto.trim().length > 2000)
    return res.status(400).json({ erro: 'Comentário não pode exceder 2000 caracteres' });

  try {
    const id = await AvaliacaoModel.comentar(req.params.id, req.usuario.id, texto);
    res.status(201).json({ id_comentario: id });
  } catch (err) {
    console.error('comentar error:', err.message);
    const { status, mensagem } = interpretarErroPG(err);
    res.status(status).json({ erro: mensagem });
  }
});

module.exports = router;
