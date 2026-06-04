/**
 * routes/catalogRoutes.ts
 */

import { Router } from 'express';
import CatalogController from '../controllers/CatalogController.js';

const router = Router();

// ── Gêneros ──────────────────────────────────────────────────
router.get('/generos', CatalogController.getAllGeneros);
router.post('/generos', CatalogController.createGenero);
router.delete('/generos/:id', CatalogController.removeGenero);

// ── Plataformas ───────────────────────────────────────────────
router.get('/plataformas', CatalogController.getAllPlataformas);
router.post('/plataformas', CatalogController.createPlataforma);
router.delete('/plataformas/:id', CatalogController.removePlataforma);

// ── Perfis ────────────────────────────────────────────────────
router.get('/perfis', CatalogController.getAllPerfis);
router.post('/perfis', CatalogController.createPerfil);
router.put('/perfis/:id', CatalogController.updatePerfil);
router.delete('/perfis/:id', CatalogController.removePerfil);

export default router;
