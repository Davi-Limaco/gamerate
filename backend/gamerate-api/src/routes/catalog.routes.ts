import { Router } from 'express';
import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.ts';
import { validate } from '@/middlewares/validate.ts';
import { authenticate } from '@/middlewares/authenticate.ts';
import { authorize } from '@/middlewares/authorize.ts';
import CatalogController from '@/controllers/catalog.controller.ts';
import { idParamSchema } from '@/schemas/id-param.schema.ts';
import { generoBodySchema, plataformaBodySchema, perfilBodySchema } from '@/schemas/catalog.schema.ts';

const router = Router();

// Consulta de gêneros/plataformas/perfis é pública (usada em filtros do
// catálogo e nos formulários de cadastro/edição de jogo).
router.get('/generos', CatalogController.readGeneros);
router.get('/plataformas', CatalogController.readPlataformas);
router.get('/perfis', CatalogController.readPerfis);

// Manutenção do catálogo (criar/remover gênero ou plataforma, gerenciar
// perfis de acesso) é restrita a administradores.
router.post('/generos', authenticate, authorize('Administrador'), requireJson, validate({ body: generoBodySchema }), CatalogController.createGenero);
router.delete('/generos/:id', authenticate, authorize('Administrador'), validate({ params: idParamSchema }), CatalogController.removeGenero);

router.post('/plataformas', authenticate, authorize('Administrador'), requireJson, validate({ body: plataformaBodySchema }), CatalogController.createPlataforma);
router.delete('/plataformas/:id', authenticate, authorize('Administrador'), validate({ params: idParamSchema }), CatalogController.removePlataforma);

router.post('/perfis', authenticate, authorize('Administrador'), requireJson, validate({ body: perfilBodySchema }), CatalogController.createPerfil);
router.put('/perfis/:id', authenticate, authorize('Administrador'), requireJson, validate({ params: idParamSchema, body: perfilBodySchema }), CatalogController.updatePerfil);
router.delete('/perfis/:id', authenticate, authorize('Administrador'), validate({ params: idParamSchema }), CatalogController.removePerfil);

export default router;
