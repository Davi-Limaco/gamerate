import Jogo from '../models/Jogo.js';

// GET /api/jogos/stats
async function getStats(req, res) {
  const stats = await Jogo.getStats();
  return res.json(stats);
}

// GET /api/jogos/destaques
async function getDestaques(req, res) {
  const destaques = await Jogo.getDestaques();
  return res.json(destaques);
}

// GET /api/jogos?search=&genero=&plataforma=
async function getAll(req, res) {
  const jogos = await Jogo.readAll(req.query);
  return res.json({ total: jogos.length, jogos });
}

// GET /api/jogos/:id
async function getById(req, res) {
  const jogo = await Jogo.readById(req.params.id);
  return res.json(jogo);
}

// POST /api/jogos
// Body: { nome_jogo, desenvolvedora, data_lancamento, descricao, capa, generos[], plataformas[] }
async function create(req, res) {
  const jogo = await Jogo.create(req.body);
  return res.status(201).json(jogo);
}

// PUT /api/jogos/:id
// Body: { nome_jogo, desenvolvedora, data_lancamento, descricao, capa }
async function update(req, res) {
  const jogo = await Jogo.update({ id: req.params.id, ...req.body });
  return res.json(jogo);
}

// DELETE /api/jogos/:id
async function remove(req, res) {
  await Jogo.remove(req.params.id);
  return res.sendStatus(204);
}

export default { getStats, getDestaques, getAll, getById, create, update, remove };
