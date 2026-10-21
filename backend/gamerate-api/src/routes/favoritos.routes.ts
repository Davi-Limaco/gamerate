import { Router } from 'express';

import FavoritosController from '@/controllers/favoritos.controller.ts';
import { authenticate } from '@/middlewares/authenticate.ts';
import { requireJsonContentType as requireJson } from '@/middlewares/requireJsonContentType.ts';
import { validate } from '@/middlewares/validate.ts';
import { favoritoBodySchema, favoritoParamSchema } from '@/schemas/favorito.schema.ts';

const router = Router();

// Favoritos pertencem ao usuário do token: não existe id de usuário na URL,
// então ninguém lê nem altera os favoritos de outra pessoa.
router.get('/favoritos', authenticate, FavoritosController.read);
router.post('/favoritos', authenticate, requireJson, validate({ body: favoritoBodySchema }), FavoritosController.create);
router.delete('/favoritos/:id_jogo', authenticate, validate({ params: favoritoParamSchema }), FavoritosController.remove);

export default router;
