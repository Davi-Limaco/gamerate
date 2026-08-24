import { Router } from 'express';
import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.ts';
import { isAuthenticated } from '@/middlewares/auth.ts';
import CatalogController from '@/controllers/catalog.controller.ts';

const router = Router();

router.get('/generos',        CatalogController.readGeneros);
router.post('/generos',       isAuthenticated, requireJson, CatalogController.createGenero);
router.delete('/generos/:id', isAuthenticated, CatalogController.removeGenero);

router.get('/plataformas',        CatalogController.readPlataformas);
router.post('/plataformas',       isAuthenticated, requireJson, CatalogController.createPlataforma);
router.delete('/plataformas/:id', isAuthenticated, CatalogController.removePlataforma);

router.get('/perfis',        CatalogController.readPerfis);
router.post('/perfis',       isAuthenticated, requireJson, CatalogController.createPerfil);
router.put('/perfis/:id',    isAuthenticated, requireJson, CatalogController.updatePerfil);
router.delete('/perfis/:id', isAuthenticated, CatalogController.removePerfil);

export default router;
