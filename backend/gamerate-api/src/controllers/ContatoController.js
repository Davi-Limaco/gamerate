import Contato from '../models/Contato.js';

// GET /api/contato
async function getAll(req, res) {
  return res.json(await Contato.readAll());
}

// POST /api/contato
async function create(req, res) {
  const contato = await Contato.create(req.body);
  return res.status(201).json(contato);
}

// DELETE /api/contato/:id
async function remove(req, res) {
  await Contato.remove(req.params.id);
  return res.sendStatus(204);
}

export default { getAll, create, remove };
