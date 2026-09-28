import { Router } from 'express';
import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.ts';
import { isAuthenticated } from '@/middlewares/auth.ts';
import { validate } from '@/middlewares/validate.ts';
import {
  createGeneroSchema,
  removeGeneroSchema,
  createPlataformaSchema,
  removePlataformaSchema,
  createPerfilSchema,
  updatePerfilAdminSchema,
  removePerfilSchema,
} from '@/schemas/index.ts';
import CatalogController from '@/controllers/catalog.controller.ts';

const router = Router();

router.get('/generos', CatalogController.readGeneros);
router.post('/generos', isAuthenticated, requireJson, validate(createGeneroSchema), CatalogController.createGenero);
router.delete('/generos/:id', isAuthenticated, validate(removeGeneroSchema), CatalogController.removeGenero);

router.get('/plataformas', CatalogController.readPlataformas);
router.post('/plataformas', isAuthenticated, requireJson, validate(createPlataformaSchema), CatalogController.createPlataforma);
router.delete('/plataformas/:id', isAuthenticated, validate(removePlataformaSchema), CatalogController.removePlataforma);

router.get('/perfis', CatalogController.readPerfis);
router.post('/perfis', isAuthenticated, requireJson, validate(createPerfilSchema), CatalogController.createPerfil);
router.put('/perfis/:id', isAuthenticated, requireJson, validate(updatePerfilAdminSchema), CatalogController.updatePerfil);
router.delete('/perfis/:id', isAuthenticated, validate(removePerfilSchema), CatalogController.removePerfil);

export default router;
