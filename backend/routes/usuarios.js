const router       = require('express').Router();
const UsuarioModel = require('../models/UsuarioModel');
const { authRequired, requirePerfil } = require('../middleware/auth');

// GET /api/usuarios/me
router.get('/me', authRequired, async (req, res) => {
  try {
    const usuario = await UsuarioModel.buscarPorId(req.usuario.id);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });
    const stats = await UsuarioModel.stats(req.usuario.id);
    res.json({ ...usuario, ...stats });
  } catch (err) {
    console.error('me error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// PUT /api/usuarios/me
router.put('/me', authRequired, async (req, res) => {
  const { nome_usuario, email, senha } = req.body;
  try {
    if (email && await UsuarioModel.emailExiste(email, req.usuario.id))
      return res.status(409).json({ erro: 'E-mail já utilizado' });
    await UsuarioModel.atualizar(req.usuario.id, { nome_usuario, email, senha });
    res.json({ mensagem: 'Perfil atualizado' });
  } catch (err) {
    console.error('atualizar perfil error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/usuarios/me/avaliacoes
router.get('/me/avaliacoes', authRequired, async (req, res) => {
  try {
    res.json(await UsuarioModel.avaliacoes(req.usuario.id));
  } catch (err) {
    console.error('me avaliacoes error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/usuarios/me/notificacoes
router.get('/me/notificacoes', authRequired, async (req, res) => {
  try {
    res.json(await UsuarioModel.notificacoes(req.usuario.id));
  } catch (err) {
    console.error('notificacoes error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/usuarios/:id/seguir
router.post('/:id/seguir', authRequired, async (req, res) => {
  const alvo = parseInt(req.params.id);
  if (alvo === req.usuario.id)
    return res.status(400).json({ erro: 'Você não pode seguir a si mesmo' });
  try {
    const seguindo = await UsuarioModel.toggleSeguir(req.usuario.id, alvo);
    res.json({ seguindo });
  } catch (err) {
    console.error('seguir error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/usuarios — admin
router.get('/', authRequired, requirePerfil('Administrador'), async (req, res) => {
  try {
    res.json(await UsuarioModel.listarTodos());
  } catch (err) {
    console.error('listar usuarios error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// PUT /api/usuarios/:id/perfil — admin
router.put('/:id/perfil', authRequired, requirePerfil('Administrador'), async (req, res) => {
  try {
    await UsuarioModel.atualizarPerfil(req.params.id, req.body.id_perfil_fk);
    res.json({ mensagem: 'Perfil atualizado' });
  } catch (err) {
    console.error('atualizar perfil admin error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// DELETE /api/usuarios/:id — admin
router.delete('/:id', authRequired, requirePerfil('Administrador'), async (req, res) => {
  try {
    await UsuarioModel.excluir(req.params.id);
    res.json({ mensagem: 'Usuário excluído' });
  } catch (err) {
    console.error('excluir usuario error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
