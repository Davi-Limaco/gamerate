import Avaliacao from '@/models/Avaliacao';
// GET /api/avaliacoes
async function getAll(req, res) {
    try {
        const result = await Avaliacao.readAll(req.query);
        return res.json({ total: result.length, avaliacoes: result });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
}
// GET /api/avaliacoes/destaque
async function getDestaque(_req, res) {
    try {
        const avaliacoes = await Avaliacao.getDestaque();
        return res.json(avaliacoes);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
}
// GET /api/avaliacoes/:id
async function getById(req, res) {
    try {
        const avaliacao = await Avaliacao.readById(req.params.id);
        return res.json(avaliacao);
    }
    catch (error) {
        return res.status(404).json({ message: error.message });
    }
}
// POST /api/avaliacoes
// Body: { id_usuario_fk, id_jogo_fk, nota, titulo, texto }
async function create(req, res) {
    try {
        const avaliacao = await Avaliacao.create(req.body);
        return res.status(201).json(avaliacao);
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
// PUT /api/avaliacoes/:id
// Body: { nota, titulo, texto }
async function update(req, res) {
    try {
        const avaliacao = await Avaliacao.update({ id: req.params.id, ...req.body });
        return res.json(avaliacao);
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
// DELETE /api/avaliacoes/:id
async function remove(req, res) {
    try {
        await Avaliacao.remove(req.params.id);
        return res.sendStatus(204);
    }
    catch (error) {
        return res.status(404).json({ message: error.message });
    }
}
export default { getDestaque, getAll, getById, create, update, remove };
