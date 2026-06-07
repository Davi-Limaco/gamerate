import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.js';
import { Router } from 'express';
import CatalogController from '@/controllers/catalog.controller.js';

const router = Router();

router.get('/generos',        CatalogController.readGeneros);
router.post('/generos',       requireJson, CatalogController.createGenero);
router.delete('/generos/:id', CatalogController.removeGenero);

router.get('/plataformas',        CatalogController.readPlataformas);
router.post('/plataformas',       requireJson, CatalogController.createPlataforma);
router.delete('/plataformas/:id', CatalogController.removePlataforma);

router.get('/perfis',        CatalogController.readPerfis);
router.post('/perfis',       requireJson, CatalogController.createPerfil);
router.put('/perfis/:id',    requireJson, CatalogController.updatePerfil);
router.delete('/perfis/:id', CatalogController.removePerfil);

export default router;
