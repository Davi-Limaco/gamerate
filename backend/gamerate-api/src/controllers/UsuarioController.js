import Usuario from '../models/Usuario.js';

// GET /api/usuarios
async function getAll(req, res) {
  return res.json(await Usuario.readAll());
}

// GET /api/usuarios/:id
async function getById(req, res) {
  const usuario = await Usuario.readById(req.params.id);
  return res.json(usuario);
}

// GET /api/usuarios/:id/avaliacoes
async function getAvaliacoes(req, res) {
  return res.json(await Usuario.readAvaliacoes(req.params.id));
}

// POST /api/usuarios
// Body: { nome_usuario, email, senha, id_perfil_fk }
async function create(req, res) {
  const usuario = await Usuario.create(req.body);
  return res.status(201).json(usuario);
}

// PUT /api/usuarios/:id
// Body: { nome_usuario, email, senha }
async function update(req, res) {
  const usuario = await Usuario.update({ id: req.params.id, ...req.body });
  return res.json(usuario);
}

// PUT /api/usuarios/:id/perfil
// Body: { id_perfil_fk }
async function updatePerfil(req, res) {
  const usuario = await Usuario.updatePerfil({ id: req.params.id, ...req.body });
  return res.json(usuario);
}

// DELETE /api/usuarios/:id
async function remove(req, res) {
  await Usuario.remove(req.params.id);
  return res.sendStatus(204);
}

// POST /api/auth/login
// Body: { email, senha }
async function login(req, res) {
  const { email, senha } = req.body;
  const usuario = await Usuario.readByEmail(email);

  if (!usuario || usuario.senha !== senha) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  // Retorna os dados do usuário logado (sem senha)
  return res.json({
    id: usuario.id_usuario,
    nome: usuario.nome_usuario,
    perfil: usuario.nome_perfil,
  });
}

// POST /api/auth/cadastro
// Body: { nome_usuario, email, senha }
async function cadastro(req, res) {
  const usuario = await Usuario.create(req.body);
  
  return res.status(201).json({
    id: usuario.id_usuario,
    nome: usuario.nome_usuario,
    perfil: usuario.nome_perfil,
  });
}

export default {
  getAll, getById, getAvaliacoes,
  create, update, updatePerfil, remove,
  login, cadastro,
};
