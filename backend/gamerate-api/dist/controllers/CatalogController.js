import { Genero, Plataforma } from '@/models/Categoria';
import Perfil from '@/models/Perfil';
// ── GÊNEROS ───────────────────────────────────────────────────
async function getAllGeneros(_req, res) {
    return res.json(await Genero.readAll());
}
async function createGenero(req, res) {
    const genero = await Genero.create(req.body);
    return res.status(201).json(genero);
}
async function removeGenero(req, res) {
    await Genero.remove(req.params.id);
    return res.sendStatus(204);
}
// ── PLATAFORMAS ───────────────────────────────────────────────
async function getAllPlataformas(_req, res) {
    return res.json(await Plataforma.readAll());
}
async function createPlataforma(req, res) {
    const plataforma = await Plataforma.create(req.body);
    return res.status(201).json(plataforma);
}
async function removePlataforma(req, res) {
    await Plataforma.remove(req.params.id);
    return res.sendStatus(204);
}
// ── PERFIS ────────────────────────────────────────────────────
async function getAllPerfis(_req, res) {
    return res.json(await Perfil.readAll());
}
async function createPerfil(req, res) {
    const perfil = await Perfil.create(req.body);
    return res.status(201).json(perfil);
}
async function updatePerfil(req, res) {
    const perfil = await Perfil.update({ id: req.params.id, ...req.body });
    return res.json(perfil);
}
async function removePerfil(req, res) {
    await Perfil.remove(req.params.id);
    return res.sendStatus(204);
}
export default {
    getAllGeneros, createGenero, removeGenero,
    getAllPlataformas, createPlataforma, removePlataforma,
    getAllPerfis, createPerfil, updatePerfil, removePerfil,
};
